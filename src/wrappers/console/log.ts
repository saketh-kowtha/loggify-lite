import handleEvent from '../../utils/handle-event';
import { EventType, LogMetadata } from '../../types';

const originalConsoleLog = console.log;

export const overrideConsoleLog = () => {
  try {
    console.log = (...args: any[]) => {
      try {
        // Always call original first to ensure logging works
        originalConsoleLog.apply(console, args);

        const metadata: LogMetadata = {
          timestamp: Date.now(),
          args: args,
        };

        // Handle event separately so it doesn't affect original logging
        try {
          handleEvent({ type: EventType.CONSOLE_LOG, data: metadata });
        } catch (e) {
          // Silently handle event errors to not affect application
        }
      } catch (e) {
        // If anything fails, ensure original logging still works
        originalConsoleLog.apply(console, args);
      }
    };
  } catch (e) {
    // If override fails, ensure original console.log remains unchanged
    console.log = originalConsoleLog;
  }
};

export const restoreConsoleLog = () => {
  try {
    console.log = originalConsoleLog;
  } catch (e) {
    // Silently handle restore errors
  }
};
