export interface ErrorEventMetadata {
  message: string;
  timestamp: number;
  type: string;
  stack?: string;
  filename?: string;
  lineNumber?: number;
  columnNumber?: number;
  error?: Error;
}

export interface ConsoleErrorMetadata {
  message: any[];
  timestamp: number;
  errors?: Error[];
  stack?: string;
}

export interface LogMetadata {
  timestamp: number;
  args: any[];
}

export interface WarnMetadata {
  timestamp: number;
  args: any[];
}

export interface FetchMetadata {
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    queryParams: Record<string, string>;
    cookies: Record<string, string>;
    httpVersion: string;
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: any;
    httpVersion: string;
    redirectURL: string;
    headersSize: number;
    bodySize: number;
    content: {
      size: number;
      mimeType: string;
      text: string;
      encoding: string;
    };
  };
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
    blocked: number;
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
    ssl: number;
  };
  cache: {
    beforeRequest: any;
    afterRequest: any;
  };
  serverIPAddress: string;
  connection: string;
  pageref: string;
}

export enum EventType {
  ERROR = 'ERROR',
  CONSOLE_ERROR = 'CONSOLE_ERROR',
  CONSOLE_LOG = 'CONSOLE_LOG',
  CONSOLE_WARN = 'CONSOLE_WARN',
  FETCH = 'FETCH',
}

export type EventData =
  | {
      type: EventType.ERROR;
      data: ErrorEventMetadata;
    }
  | {
      type: EventType.CONSOLE_ERROR;
      data: ConsoleErrorMetadata;
    }
  | {
      type: EventType.CONSOLE_LOG;
      data: LogMetadata;
    }
  | {
      type: EventType.CONSOLE_WARN;
      data: WarnMetadata;
    }
  | {
      type: EventType.FETCH;
      data: FetchMetadata;
    };

export interface WriteDBParams {
  dbName: string;
  storeName: string;
  event: EventData;
}

export interface ReadDBParams {
  dbName: string;
  storeName: string;
}

export interface LoggifyConfig {
  maxDBSize: number;
  storeName: string;
  dbName: string;
  maxEvents: number;
  windowMs: number;
  samplingRates: {
    ERROR: number;
    CONSOLE_ERROR: number;
    CONSOLE_LOG: number;
    CONSOLE_WARN: number;
    FETCH: number;
  };
  allowConsoleLogs: boolean;
  allowConsoleErrors: boolean;
  allowConsoleWarnings: boolean;
  allowNetworkRequests: boolean;
  allowErrors: boolean;
}
