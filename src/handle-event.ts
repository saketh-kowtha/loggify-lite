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
  switch (eventData.type) {
    case EventType.ERROR:
      storeToDB(EventType.ERROR, eventData);
      break;
    case EventType.CONSOLE_ERROR:
      storeToDB(EventType.CONSOLE_ERROR, eventData);
      break;
    case EventType.CONSOLE_LOG:
      storeToDB(EventType.CONSOLE_LOG, eventData);
      break;
    case EventType.CONSOLE_WARN:
      storeToDB(EventType.CONSOLE_WARN, eventData);
      break;
    case EventType.FETCH:
      storeToDB(EventType.FETCH, eventData);
      break;
  }
};

export default handleEvent;
