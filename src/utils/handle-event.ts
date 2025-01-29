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
  events: events, // Use direct reference to avoid nesting
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

// Generate fingerprint for deduplication only for error and console events
const getEventFingerprint = (eventData: EventData): string | null => {
  const { type, data } = eventData;
  switch (type) {
    case EventType.ERROR:
    case EventType.CONSOLE_ERROR:
      return `${type}-${data.message}-${data.stack || ''}`;
    case EventType.CONSOLE_LOG:
    case EventType.CONSOLE_WARN:
      return `${type}-${JSON.stringify(data.args)}`;
    default:
      return null; // No fingerprint for other event types
  }
};

const handleEvent = (eventData: EventData): void => {
  try {
    if (!eventData || typeof eventData !== 'object') {
      return;
    }

    if (!eventData.type || !(eventData.type in EventType)) {
      return;
    }

    // Apply sampling
    const samplingRate = getSamplingRates()[eventData.type] || 1;
    if (Math.random() > samplingRate) {
      return;
    }

    const fingerprint = getEventFingerprint(eventData);
    const now = Date.now();

    // Only apply rate limiting for events that have a fingerprint
    if (fingerprint) {
      // Get existing events array or create new one
      let eventTimes = events.get(fingerprint);
      if (!eventTimes) {
        eventTimes = [];
      }

      // Remove timestamps outside current window
      const windowStart = now - getRateLimit().windowMs;
      eventTimes = eventTimes.filter((time) => time > windowStart);

      if (eventTimes.length >= getRateLimit().maxEvents) {
        return;
      }

      // Update rate limiting tracker with new array
      eventTimes.push(now);
      events.set(fingerprint, eventTimes);
    }

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
          // Silent error
        }
        break;
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.1) {
      // 10% chance to run cleanup
      for (const key of Array.from(getRateLimit().events.keys())) {
        const times = getRateLimit().events.get(key) || [];
        const windowStart = now - getRateLimit().windowMs;
        const validTimes = times.filter((time) => time > windowStart);
        if (validTimes.length === 0) {
          getRateLimit().events.delete(key);
        } else {
          getRateLimit().events.set(key, validTimes);
        }
      }
    }
  } catch (error) {
    // Silent error
  }
};

export default runLowPriority<EventData, void>(handleEvent);
