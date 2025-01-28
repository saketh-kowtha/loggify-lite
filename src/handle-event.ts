import { EventData, EventType } from './types';

const handleEvent = (eventData: EventData) => {
  switch (eventData.type) {
    case EventType.ERROR:
      break;
    case EventType.CONSOLE_ERROR:
      break;
    case EventType.CONSOLE_LOG:
      break;
    case EventType.CONSOLE_WARN:
      break;
    case EventType.FETCH:
      break;
  }
};

export default handleEvent;
