import { ErrorEventMetadata } from '../types';

let errorCallback: ((metadata: ErrorEventMetadata) => void) | null = null;

export const setErrorCallback = (
  callback: (metadata: ErrorEventMetadata) => void,
) => {
  errorCallback = callback;
};

const handleError = (metadata: ErrorEventMetadata) => {
  if (errorCallback) {
    errorCallback(metadata);
  }
  console.error('Error Event Metadata:', metadata);
};

// Handle unhandled promise rejections
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
  const error = event.reason;
  const metadata: ErrorEventMetadata = {
    message: error?.message || 'Unhandled Promise Rejection',
    timestamp: Date.now(),
    type: 'unhandled-rejection',
    stack: error?.stack,
    error: error instanceof Error ? error : undefined,
  };
  handleError(metadata);
};

// Handle runtime errors
const runtimeErrorHandler = (event: ErrorEvent) => {
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
};

export const initializeErrorTracking = () => {
  // Handle uncaught errors
  window.onerror = (message, source, lineno, colno, error) => {
    const metadata: ErrorEventMetadata = {
      message: message.toString(),
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
  };

  window.addEventListener('unhandledrejection', unhandledRejectionHandler);

  window.addEventListener('error', runtimeErrorHandler);
};

export const cleanupErrorTracking = () => {
  window.onerror = null;
  window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
  window.removeEventListener('error', runtimeErrorHandler);
  errorCallback = null;
};
