import { EventData, EventType } from './types';
import writeToDB from './db-operations/write-to-db';

function storeToDB(eventType: keyof typeof EventType, eventData: EventData) {
  writeToDB({
    dbName: 'loggify',
    storeName: 'logs',
    event: { type: eventType, data: eventData },
  });
}

const handleEvent = (eventData: EventData) => {
  try {
    if (!eventData || typeof eventData !== 'object') {
      console.error('Invalid event data received:', eventData);
      return;
    }

    if (!eventData.type || !(eventData.type in EventType)) {
      console.error('Invalid event type received:', eventData.type);
      return;
    }

    switch (eventData.type) {
      case EventType.ERROR:
      case EventType.CONSOLE_ERROR:
      case EventType.CONSOLE_LOG:
      case EventType.CONSOLE_WARN:
      case EventType.FETCH:
        try {
          storeToDB(eventData.type, eventData);
        } catch (storeError) {
          console.error('Failed to store event to DB:', {
            eventType: eventData.type,
            error: storeError,
          });
        }
        break;
    }
  } catch (error) {
    // console.error('Error in handleEvent:', error);
  }
};

export default handleEvent;
