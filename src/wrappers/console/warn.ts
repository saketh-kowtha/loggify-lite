import { WarnMetadata } from '../../types';

const originalConsoleWarn = console.warn;

export const overrideConsoleWarn = () => {
  console.warn = (...args: any[]) => {
    const metadata: WarnMetadata = {
      timestamp: Date.now(),
      args: args,
    };

    // Call original console.warn with both the original arguments and metadata
    originalConsoleWarn(...args);
    originalConsoleWarn('Warning Metadata:', metadata);
  };
};

export const restoreConsoleWarn = () => {
  console.warn = originalConsoleWarn;
};
