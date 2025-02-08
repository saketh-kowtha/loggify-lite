import { setErrorCallback, initializeErrorTracking } from './';

describe('Error Events', () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    mockCallback = jest.fn();
    // Reset callback before each test
    setErrorCallback(null as any);
    // Clear any existing event listeners
    window.onerror = null;
    window.onunhandledrejection = null;
    window.removeEventListener('error', () => {});
  });

  describe('setErrorCallback', () => {
    it('should handle callback setting errors silently', () => {
      const badCallback = {
        toString: () => {
          throw new Error('Callback error');
        },
      };

      expect(() => setErrorCallback(badCallback as any)).not.toThrow();
    });
  });

  describe('Error Tracking', () => {
    beforeEach(() => {
      setErrorCallback(mockCallback);
      initializeErrorTracking();
    });

    it('should handle runtime errors', () => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Runtime error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      });

      window.dispatchEvent(errorEvent);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Runtime error',
          type: 'runtime-error',
          filename: 'test.js',
          lineNumber: 1,
          columnNumber: 1,
        }),
      );
    });

    it('should handle window.onerror', () => {
      if (window.onerror) {
        window.onerror(
          'Global error',
          'test.js',
          1,
          1,
          new Error('Global error'),
        );
      }

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Global error',
          type: 'uncaught-error',
          filename: 'test.js',
          lineNumber: 1,
          columnNumber: 1,
        }),
      );
    });

    it('should handle errors without Error objects', () => {
      const errorEvent = new ErrorEvent('error', {
        message: 'String error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: 'String error',
      });

      window.dispatchEvent(errorEvent);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'String error',
          type: 'runtime-error',
        }),
      );
    });

    it('should handle missing error callback gracefully', () => {
      setErrorCallback(null as any);

      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      });

      expect(() => window.dispatchEvent(errorEvent)).not.toThrow();
    });
  });
});
