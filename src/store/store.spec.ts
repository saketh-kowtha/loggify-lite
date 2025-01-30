import { LoggifyConfig } from '../types';
import configStore from './index';

describe('ConfigStore', () => {
  let store: typeof configStore;

  beforeEach(() => {
    // Reset the singleton instance before each test
    (configStore.constructor as any).instance = null;
    store = configStore;
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = configStore;
      const instance2 = configStore;
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConfig', () => {
    it('should return default config initially', () => {
      const config = store.getConfig();
      expect(config).toEqual({
        maxDBSize: 1024 * 1024 * 50,
        storeName: 'logs',
        dbName: 'loggify',
        maxEvents: 100,
        windowMs: 60000,
        samplingRates: {
          ERROR: 1,
          CONSOLE_ERROR: 0.5,
          CONSOLE_LOG: 0.1,
          CONSOLE_WARN: 0.3,
          FETCH: 0.5,
        },
        allowConsoleLogs: false,
        allowConsoleErrors: true,
        allowConsoleWarnings: false,
        allowNetworkRequests: true,
        allowErrors: true,
      });
    });

    it('should return a copy of config, not the reference', () => {
      const config1 = store.getConfig();
      const config2 = store.getConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('updateConfig', () => {
    it('should partially update the config', () => {
      const newConfig: Partial<LoggifyConfig> = {
        maxDBSize: 1024 * 1024 * 100,
        storeName: 'newLogs',
      };

      store.updateConfig(newConfig);
      const updatedConfig = store.getConfig();

      expect(updatedConfig.maxDBSize).toBe(1024 * 1024 * 100);
      expect(updatedConfig.storeName).toBe('newLogs');
      // Other properties should remain unchanged
      expect(updatedConfig.dbName).toBe('loggify');
    });

    it('should notify subscribers when config is updated', () => {
      const mockCallback = jest.fn();
      store.subscribe(mockCallback);

      const newConfig: Partial<LoggifyConfig> = {
        maxDBSize: 1024 * 1024 * 100,
      };

      store.updateConfig(newConfig);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(store.getConfig());
    });
  });

  describe('resetConfig', () => {
    it('should reset config to default values', () => {
      store.updateConfig({
        maxDBSize: 1024 * 1024 * 100,
        storeName: 'newLogs',
      });

      store.resetConfig();
      const resetConfig = store.getConfig();

      expect(resetConfig.maxDBSize).toBe(1024 * 1024 * 50);
      expect(resetConfig.storeName).toBe('logs');
    });

    it('should notify subscribers when config is reset', () => {
      const mockCallback = jest.fn();
      store.subscribe(mockCallback);

      store.resetConfig();
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(store.getConfig());
    });
  });

  describe('subscribe', () => {
    it('should add subscriber and return unsubscribe function', () => {
      const mockCallback = jest.fn();
      const unsubscribe = store.subscribe(mockCallback);

      store.updateConfig({ maxDBSize: 1024 * 1024 * 100 });
      expect(mockCallback).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.updateConfig({ maxDBSize: 1024 * 1024 * 200 });
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1, not called after unsubscribe
    });

    it('should allow multiple subscribers', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();

      store.subscribe(mockCallback1);
      store.subscribe(mockCallback2);

      store.updateConfig({ maxDBSize: 1024 * 1024 * 100 });

      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
  });
});
