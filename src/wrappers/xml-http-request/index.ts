import handleEvent from '../../utils/handle-event';
import { EventType, FetchMetadata } from '../../types';
import store from '../../store';

const originalXHR = window.XMLHttpRequest;

export const overrideXHR = () => {
  window.XMLHttpRequest = class extends originalXHR {
    private metadata: FetchMetadata;
    private startTime: number;

    constructor() {
      super();
      this.startTime = performance.now();
      this.metadata = {
        request: {
          url: '',
          method: 'GET',
          headers: {},
          queryParams: {},
          cookies: {},
          httpVersion: 'HTTP/1.1',
          headersSize: 0,
          bodySize: 0,
        },
        response: {
          status: 0,
          statusText: '',
          headers: {},
          httpVersion: 'HTTP/1.1',
          redirectURL: '',
          headersSize: 0,
          bodySize: 0,
          content: {
            size: 0,
            mimeType: '',
            text: '',
            encoding: '',
          },
        },
        timing: {
          startTime: this.startTime,
          endTime: 0,
          duration: 0,
          blocked: -1,
          dns: -1,
          connect: -1,
          send: 0,
          wait: 0,
          receive: 0,
          ssl: -1,
        },
        cache: {
          beforeRequest: null,
          afterRequest: null,
        },
        serverIPAddress: '',
        connection: '',
        pageref: window.location.href,
      };

      // Parse cookies
      try {
        this.metadata.request.cookies = document.cookie
          ? Object.fromEntries(
              document.cookie.split(';').map((cookie) => {
                const [key, value] = cookie.trim().split('=');
                return [key, value];
              }),
            )
          : {};
      } catch {}

      this.addEventListener('loadend', () => {
        // Handle both success and error cases since loadend fires in both scenarios
        if (this.status === 0 || this.status >= 400) {
          this.metadata.error = new Error(
            `Request failed with status ${this.status}`,
          );
        }
        try {
          const endTime = performance.now();

          // Silently collect response data
          try {
            this.metadata.response.status = this.status;
            this.metadata.response.statusText = this.statusText;

            // Headers
            const headerString = this.getAllResponseHeaders();
            if (headerString) {
              const headerPairs = headerString.split('\r\n').filter(Boolean);
              this.metadata.response.headers = headerPairs.reduce(
                (acc, curr) => {
                  const [key, value] = curr.split(': ');
                  if (key && value) {
                    acc[key.toLowerCase()] = value;
                    if (key.toLowerCase() === 'content-type') {
                      this.metadata.response.content.mimeType = value;
                    }
                  }
                  return acc;
                },
                {} as Record<string, string>,
              );
            }

            this.metadata.response.headersSize = Object.entries(
              this.metadata.response.headers,
            ).reduce(
              (size, [key, value]) => size + key.length + value.length + 4,
              0,
            );

            // Body
            if (this.responseText) {
              const responseBody = this.responseText;
              this.metadata.response.content.text = responseBody;
              this.metadata.response.content.size = responseBody.length;
              this.metadata.response.bodySize = responseBody.length;
              try {
                this.metadata.response.body = JSON.parse(responseBody);
              } catch {
                this.metadata.response.body = responseBody;
              }
            }

            // Timing
            const loadEndTime = performance.now();
            this.metadata.timing.endTime = loadEndTime;
            this.metadata.timing.duration = loadEndTime - this.startTime;
            this.metadata.timing.wait = endTime - this.startTime;
            this.metadata.timing.receive = loadEndTime - endTime;
          } catch {}

          if (store.getConfig().allowNetworkRequests) {
            handleEvent({
              type: EventType.FETCH,
              data: this.metadata,
            });
          }
        } catch (error) {
          this.metadata.error = error as Error;
          if (store.getConfig().allowNetworkRequests) {
            handleEvent({
              type: EventType.FETCH,
              data: this.metadata,
            });
          }
        }
      });
    }

    open(method: string, url: string, ...args: any[]) {
      try {
        this.metadata.request.method = method;
        this.metadata.request.url = url;

        // Parse query params
        try {
          const urlObj = new URL(url, window.location.origin);
          urlObj.searchParams.forEach((value, key) => {
            this.metadata.request.queryParams[key] = value;
          });
        } catch {}
      } catch {}

      // @ts-ignore
      super.open(method, url, ...args);
    }

    setRequestHeader(header: string, value: string) {
      try {
        if (header && value) {
          this.metadata.request.headers[header.toLowerCase()] = value;
          this.metadata.request.headersSize += header.length + value.length + 4;
        }
      } catch {}

      super.setRequestHeader(header, value);
    }

    send(body?: Document | XMLHttpRequestBodyInit | null) {
      try {
        if (body) {
          try {
            this.metadata.request.body =
              typeof body === 'string' ? JSON.parse(body) : body;
          } catch {
            this.metadata.request.body = body;
          }
          this.metadata.request.bodySize = String(body).length;
        }
      } catch {}

      super.send(body);
    }
  };
};

export const restoreXHR = () => {
  try {
    window.XMLHttpRequest = originalXHR;
  } catch {}
};
