import {
  cleanupErrorTracking,
  initializeErrorTracking,
} from './utils/error-events';
import { LoggifyConfig } from './types';
import {
  overrideConsoleError,
  restoreConsoleError,
} from './wrappers/console/error';
import { overrideConsoleLog, restoreConsoleLog } from './wrappers/console/log';
import {
  overrideConsoleWarn,
  restoreConsoleWarn,
} from './wrappers/console/warn';
import { overrideFetch, restoreFetch } from './wrappers/fetch';
import { overrideXHR, restoreXHR } from './wrappers/xml-http-request';
import configStore from './store';
import exportEvents from './utils/export-as-json';
import { initializeDB } from './idb';

export function initializeLogger(config: LoggifyConfig) {
  initializeDB();
  if (config.allowErrors) initializeErrorTracking();
  if (config.allowConsoleErrors) overrideConsoleError();
  if (config.allowConsoleLogs) overrideConsoleLog();
  if (config.allowConsoleWarnings) overrideConsoleWarn();
  if (config.allowNetworkRequests) overrideFetch();
  if (config.allowNetworkRequests) overrideXHR();
  configStore.updateConfig(config);
}

export function uninitializeLogger() {
  const config = configStore.getConfig();
  if (config.allowErrors) cleanupErrorTracking();
  if (config.allowConsoleErrors) restoreConsoleError();
  if (config.allowConsoleLogs) restoreConsoleLog();
  if (config.allowConsoleWarnings) restoreConsoleWarn();
  if (config.allowNetworkRequests) restoreFetch();
  if (config.allowNetworkRequests) restoreXHR();
}

export { exportEvents };

export * from './types';
