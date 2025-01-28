import { ErrorEventMetadata } from '../../types';

let errorCallback: ((metadata: ErrorEventMetadata) => void) | null = null;

export const setErrorCallback = (
  callback: (metadata: ErrorEventMetadata) => void,
) => {
  try {
    errorCallback = callback;
  } catch (e) {
    // Silently handle callback setting errors
  }
};

const handleError = (metadata: ErrorEventMetadata) => {
  try {
    if (errorCallback) {
      try {
        errorCallback(metadata);
      } catch (e) {
        // Silently handle callback execution errors
      }
    }
    console.error('Error Event Metadata:', metadata);
  } catch (e) {
    // Ensure error handling never throws
  }
};

// Handle unhandled promise rejections
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
  try {
    const error = event.reason;
    const metadata: ErrorEventMetadata = {
      message: error?.message || 'Unhandled Promise Rejection',
      timestamp: Date.now(),
      type: 'unhandled-rejection',
      stack: error?.stack,
      error: error instanceof Error ? error : undefined,
    };
    handleError(metadata);
  } catch (e) {
    // Silently handle rejection errors
  }
};

// Handle runtime errors
const runtimeErrorHandler = (event: ErrorEvent) => {
  try {
    // Skip if this is an Error object, as it will be caught by window.onerror
    if (event.error instanceof Error) {
      return;
    }

    const metadata: ErrorEventMetadata = {
      message: event.message,
      timestamp: Date.now(),
      type: 'runtime-error',
      filename: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
      error: event.error,
    };
    handleError(metadata);
  } catch (e) {
    // Silently handle runtime error handling errors
  }
};

export const initializeErrorTracking = () => {
  try {
    // Handle uncaught errors
    window.onerror = (message, source, lineno, colno, error) => {
      try {
        const metadata: ErrorEventMetadata = {
          message: message?.toString() || 'Unknown Error',
          timestamp: Date.now(),
          type: 'uncaught-error',
          filename: source,
          lineNumber: lineno,
          columnNumber: colno,
          error: error || undefined,
          stack: error?.stack,
        };
        handleError(metadata);
        return false; // Let the error propagate
      } catch (e) {
        return false; // Ensure original error still propagates
      }
    };

    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    window.addEventListener('error', runtimeErrorHandler);
  } catch (e) {
    // Silently handle initialization errors
  }
};

export const cleanupErrorTracking = () => {
  try {
    window.onerror = null;
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    window.removeEventListener('error', runtimeErrorHandler);
    errorCallback = null;
  } catch (e) {
    // Silently handle cleanup errors
  }
};
