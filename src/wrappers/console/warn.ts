import handleEvent from '../../utils/handle-event';
import { EventType, WarnMetadata } from '../../types';

const originalConsoleWarn = console.warn;

export const overrideConsoleWarn = () => {
  try {
    console.warn = (...args: any[]) => {
      try {
        // Always call original first to ensure warning is shown
        originalConsoleWarn.apply(console, args);

        const metadata: WarnMetadata = {
          timestamp: Date.now(),
          args: args,
        };

        // Handle event separately so it doesn't affect original warning
        try {
          handleEvent({ type: EventType.CONSOLE_WARN, data: metadata });
        } catch (e) {
          // Silently handle event errors to not affect application
        }
      } catch (e) {
        // If anything fails, ensure original warning still works
        originalConsoleWarn.apply(console, args);
      }
    };
  } catch (e) {
    // If override fails, ensure original console.warn remains unchanged
    console.warn = originalConsoleWarn;
  }
};

export const restoreConsoleWarn = () => {
  try {
    console.warn = originalConsoleWarn;
  } catch (e) {
    // Silently handle restore errors
  }
};
