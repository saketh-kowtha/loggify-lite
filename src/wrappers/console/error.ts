import { ConsoleErrorMetadata } from '../../types';

const originalConsoleError = console.error;

export const overrideConsoleError = () => {
  console.error = (...args: any[]) => {
    const metadata: ConsoleErrorMetadata = {
      message: args,
      timestamp: Date.now(),
    };

    // Extract error object and stack trace if present
    const errorObjects = args.filter((arg) => arg instanceof Error);
    if (errorObjects.length > 0) {
      metadata.errors = errorObjects;
      metadata.stack = errorObjects.map((error) => error.stack).join('\n\n');
    }

    // Call original console.error
    originalConsoleError.apply(console, args);

    // Log the collected metadata
    originalConsoleError('Console Error Metadata:', metadata);
  };
};

export const restoreConsoleError = () => {
  console.error = originalConsoleError;
};
