import { EventData, EventType } from '../types';
import writeToDB from './db-operations/write-to-db';
import runLowPriority from './run-low-priority';
import configStore from '../store';

function storeToDB(eventType: keyof typeof EventType, eventData: EventData) {
  writeToDB({
    dbName: configStore.getConfig().dbName,
    storeName: configStore.getConfig().storeName,
    event: { type: eventType, data: eventData },
  });
}

// Rate limiting configuration
// Track event timestamps
const events = new Map<string, number[]>();

const getRateLimit = () => ({
  maxEvents: configStore.getConfig().maxEvents,
  windowMs: configStore.getConfig().windowMs,
  events, // Reference the external events Map
});

// Sampling rates for different event types
const getSamplingRates = () => ({
  [EventType.ERROR]: configStore.getConfig().samplingRates.ERROR,
  [EventType.CONSOLE_ERROR]:
    configStore.getConfig().samplingRates.CONSOLE_ERROR,
  [EventType.CONSOLE_LOG]: configStore.getConfig().samplingRates.CONSOLE_LOG,
  [EventType.CONSOLE_WARN]: configStore.getConfig().samplingRates.CONSOLE_WARN,
  [EventType.FETCH]: configStore.getConfig().samplingRates.FETCH,
});

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

const handleEvent = (eventData: EventData): void => {
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
    const samplingRate = getSamplingRates()[eventData.type] || 1;
    if (Math.random() > samplingRate) {
      return;
    }

    // Rate limiting
    const now = Date.now();
    const fingerprint = getEventFingerprint(eventData);
    const eventTimes = getRateLimit().events.get(fingerprint) || [];

    // Remove timestamps outside current window
    const windowStart = now - getRateLimit().windowMs;
    const recentEvents = eventTimes.filter((time) => time > windowStart);

    if (recentEvents.length >= getRateLimit().maxEvents) {
      // console.warn(`Rate limit exceeded for event type: ${eventData.type}`);
      return;
    }

    // Update rate limiting tracker
    getRateLimit().events.set(fingerprint, [...recentEvents, now]);

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
      Array.from(getRateLimit().events).forEach(([key, times]) => {
        const validTimes = times.filter((time) => time > windowStart);
        if (validTimes.length === 0) {
          getRateLimit().events.delete(key);
        } else {
          getRateLimit().events.set(key, validTimes);
        }
      });
    }
  } catch (error) {
    // console.error('Error in handleEvent:', error);
  }
};

export default runLowPriority<EventData, void>(handleEvent);
