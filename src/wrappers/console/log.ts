import { LogMetadata } from '../../types';

const originalConsoleLog = console.log;

export const overrideConsoleLog = () => {
  console.log = (...args: any[]) => {
    const metadata: LogMetadata = {
      timestamp: Date.now(),
      args: args,
    };

    // Call original console.log with both the original arguments and metadata
    originalConsoleLog(...args);
    originalConsoleLog('Log Metadata:', metadata);
  };
};

export const restoreConsoleLog = () => {
  console.log = originalConsoleLog;
};
