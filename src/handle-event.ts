import { EventData, EventType } from './types';
import writeToDB from './db-operations/write-to-db';

function storeToDB(eventType: keyof typeof EventType, eventData: EventData) {
  writeToDB({
    dbName: 'loggify',
    storeName: 'logs',
    event: { type: eventType, data: eventData },
  });
}

// Rate limiting configuration
const RATE_LIMIT = {
  maxEvents: 100, // Maximum events per window
  windowMs: 60000, // 1 minute window
  events: new Map<string, number[]>(), // Track event timestamps
};

// Sampling rates for different event types
const SAMPLING_RATES = {
  [EventType.ERROR]: 1, // Capture all errors
  [EventType.CONSOLE_ERROR]: 0.5, // Capture 50% of console errors
  [EventType.CONSOLE_LOG]: 0.1, // Capture 10% of logs
  [EventType.CONSOLE_WARN]: 0.3, // Capture 30% of warnings
  [EventType.FETCH]: 0.2, // Capture 20% of fetch calls
};

// Generate fingerprint for deduplication
const getEventFingerprint = (eventData: EventData): string => {
  const { type, data } = eventData;
  switch (type) {
    case EventType.ERROR:
    case EventType.CONSOLE_ERROR:
      return `${type}-${data.message}-${data.stack || ''}`;
    case EventType.CONSOLE_LOG:
    case EventType.CONSOLE_WARN:
      return `${type}-${JSON.stringify(data.args)}`;
    case EventType.FETCH:
      return `${type}-${data.request.url}-${data.request.method}`;
    default:
      return `${type}-${JSON.stringify(data)}`;
  }
};

const handleEvent = (eventData: EventData) => {
  try {
    if (!eventData || typeof eventData !== 'object') {
      // console.error('Invalid event data received:', eventData);
      return;
    }

    if (!eventData.type || !(eventData.type in EventType)) {
      // console.error('Invalid event type received:', eventData.type);
      return;
    }

    // Apply sampling
    const samplingRate = SAMPLING_RATES[eventData.type] || 1;
    if (Math.random() > samplingRate) {
      return;
    }

    // Rate limiting
    const now = Date.now();
    const fingerprint = getEventFingerprint(eventData);
    const eventTimes = RATE_LIMIT.events.get(fingerprint) || [];

    // Remove timestamps outside current window
    const windowStart = now - RATE_LIMIT.windowMs;
    const recentEvents = eventTimes.filter((time) => time > windowStart);

    if (recentEvents.length >= RATE_LIMIT.maxEvents) {
      // console.warn(`Rate limit exceeded for event type: ${eventData.type}`);
      return;
    }

    // Update rate limiting tracker
    RATE_LIMIT.events.set(fingerprint, [...recentEvents, now]);

    // Store event
    switch (eventData.type) {
      case EventType.ERROR:
      case EventType.CONSOLE_ERROR:
      case EventType.CONSOLE_LOG:
      case EventType.CONSOLE_WARN:
      case EventType.FETCH:
        try {
          storeToDB(eventData.type, eventData);
        } catch (storeError) {
          // console.error('Failed to store event to DB:', {
          //   eventType: eventData.type,
          //   error: storeError,
          // });
        }
        break;
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.1) {
      // 10% chance to run cleanup
      Array.from(RATE_LIMIT.events).forEach(([key, times]) => {
        const validTimes = times.filter((time) => time > windowStart);
        if (validTimes.length === 0) {
          RATE_LIMIT.events.delete(key);
        } else {
          RATE_LIMIT.events.set(key, validTimes);
        }
      });
    }
  } catch (error) {
    // console.error('Error in handleEvent:', error);
  }
};

export default handleEvent;
