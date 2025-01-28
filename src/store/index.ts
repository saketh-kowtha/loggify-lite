import { LoggifyConfig } from '../types';

const defaultConfig: LoggifyConfig = {
  maxDBSize: 1024 * 1024 * 50, // 50MB
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
};

class ConfigStore {
  private static instance: ConfigStore;
  private config: LoggifyConfig;
  private subscribers: Set<(config: LoggifyConfig) => void>;

  private constructor() {
    this.config = { ...defaultConfig };
    this.subscribers = new Set();
  }

  static getInstance(): ConfigStore {
    if (!ConfigStore.instance) {
      ConfigStore.instance = new ConfigStore();
    }
    return ConfigStore.instance;
  }

  getConfig(): LoggifyConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<LoggifyConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.notifySubscribers();
  }

  resetConfig(): void {
    this.config = { ...defaultConfig };
    this.notifySubscribers();
  }

  subscribe(callback: (config: LoggifyConfig) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const configCopy = this.getConfig();
    this.subscribers.forEach((callback) => callback(configCopy));
  }
}

export default ConfigStore.getInstance();
