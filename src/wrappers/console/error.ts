import handleEvent from '../../utils/handle-event';
import { ConsoleErrorMetadata, EventType } from '../../types';

const originalConsoleError = console.error;

export const overrideConsoleError = () => {
  try {
    console.error = (...args: any[]) => {
      try {
        // Always call original first to ensure error is shown
        originalConsoleError.apply(console, args);

        const metadata: ConsoleErrorMetadata = {
          message: args,
          timestamp: Date.now(),
        };

        // Extract error object and stack trace if present
        try {
          const errorObjects = args.filter((arg) => arg instanceof Error);
          if (errorObjects.length > 0) {
            metadata.errors = errorObjects;
            metadata.stack = errorObjects
              .map((error) => error.stack)
              .join('\n\n');
          }
        } catch (e) {
          // Silently handle error extraction failures
        }

        // Handle event separately so it doesn't affect original error logging
        try {
          handleEvent({ type: EventType.CONSOLE_ERROR, data: metadata });
        } catch (e) {
          // Silently handle event errors to not affect application
        }
      } catch (e) {
        // If anything fails, ensure original error logging still works
        originalConsoleError.apply(console, args);
      }
    };
  } catch (e) {
    // If override fails, ensure original console.error remains unchanged
    console.error = originalConsoleError;
  }
};

export const restoreConsoleError = () => {
  try {
    console.error = originalConsoleError;
  } catch (e) {
    // Silently handle restore errors
  }
};
