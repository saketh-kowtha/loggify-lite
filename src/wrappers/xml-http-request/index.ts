import { EventType, FetchMetadata } from '../../types';
import handleEvent from '../../utils/handle-event';
import store from '../../store';

const originalXHR = window.XMLHttpRequest;

export const overrideXHR = () => {
  try {
    window.XMLHttpRequest = class extends originalXHR {
      private metadata!: FetchMetadata;
      private startTime: number = 0;
      private startedDateTime: string = '';

      constructor() {
        super();
        try {
          this.startedDateTime = new Date().toISOString();
          this.metadata = {
            request: {
              url: '',
              method: '',
              headers: {},
              queryParams: {},
              cookies: document.cookie
                ? Object.fromEntries(
                    document.cookie.split(';').map((cookie) => {
                      const [key, value] = cookie.trim().split('=');
                      return [key, value];
                    }),
                  )
                : {},
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
              startTime: 0,
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

          this.addEventListener('loadend', () => {
            try {
              const endTime = performance.now();
              this.metadata.timing.endTime = endTime;
              this.metadata.timing.duration = endTime - this.startTime;

              // Collect response metadata
              this.metadata.response.status = this.status;
              this.metadata.response.statusText = this.statusText;

              // Parse response headers
              try {
                const headerString = this.getAllResponseHeaders();
                if (headerString) {
                  const headerPairs = headerString
                    .split('\r\n')
                    .filter(Boolean);
                  this.metadata.response.headers = headerPairs.reduce(
                    (acc, curr) => {
                      try {
                        const [key, value] = curr.split(': ');
                        if (key && value) {
                          acc[key.toLowerCase()] = value;
                          if (key.toLowerCase() === 'content-type') {
                            this.metadata.response.content.mimeType = value;
                          }
                        }
                        return acc;
                      } catch (e) {
                        return acc;
                      }
                    },
                    {} as Record<string, string>,
                  );
                }
              } catch (e) {
                // Silently handle header parsing errors
              }

              // Calculate headers size
              this.metadata.response.headersSize = Object.entries(
                this.metadata.response.headers,
              ).reduce(
                (size, [key, value]) => size + key.length + value.length + 4,
                0,
              );

              // Try to parse response body
              try {
                if (this.responseText) {
                  this.metadata.response.content.text = this.responseText;
                  this.metadata.response.content.size =
                    this.responseText.length;
                  this.metadata.response.bodySize = this.responseText.length;
                  try {
                    this.metadata.response.body = JSON.parse(this.responseText);
                  } catch (e) {
                    this.metadata.response.body = this.responseText;
                  }
                }
              } catch (e) {
                // If getting responseText fails, we'll skip body
              }

              // Calculate timing metrics
              const timingEnd = performance.now();
              this.metadata.timing.wait = timingEnd - this.startTime;
              this.metadata.timing.receive = endTime - timingEnd;

              // Send event to handler
              if (this.status >= 400) {
                // Always send failed requests
                handleEvent({ type: EventType.FETCH, data: this.metadata });
              } else if (store.getConfig().allowNetworkRequests) {
                // Only send successful requests if allowed
                handleEvent({ type: EventType.FETCH, data: this.metadata });
              }
            } catch (e) {
              // Ensure loadend listener never throws
            }
          });
        } catch (e) {
          throw e;
        }
      }

      open(method: string, url: string, ...args: any[]) {
        try {
          this.startTime = performance.now();
          this.metadata.timing.startTime = this.startTime;
          this.metadata.request.method = method;
          this.metadata.request.url = url;

          // Parse query parameters from URL
          try {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.forEach((value, key) => {
              this.metadata.request.queryParams[key] = value;
            });
          } catch (e) {
            // Silently handle URL parsing errors
          }
        } catch (e) {
          // Ensure metadata collection never breaks original functionality
        }

        try {
          // @ts-ignore
          super.open(method, url, ...args);
        } catch (e) {
          // If super.open fails, throw the original error
          throw e;
        }
      }

      setRequestHeader(header: string, value: string) {
        try {
          if (header && value) {
            this.metadata.request.headers[header.toLowerCase()] = value;
            this.metadata.request.headersSize +=
              header.length + value.length + 4; // 4 for ': ' and '\r\n'
          }
        } catch (e) {
          // Ensure metadata collection never breaks original functionality
        }

        try {
          super.setRequestHeader(header, value);
        } catch (e) {
          // If super.setRequestHeader fails, throw the original error
          throw e;
        }
      }

      send(body?: Document | XMLHttpRequestBodyInit | null) {
        try {
          if (body) {
            try {
              this.metadata.request.body =
                typeof body === 'string' ? JSON.parse(body) : body;
              this.metadata.request.bodySize =
                typeof body === 'string'
                  ? body.length
                  : JSON.stringify(body).length;
            } catch (e) {
              this.metadata.request.body = body;
              this.metadata.request.bodySize = String(body).length;
            }
          }
        } catch (e) {
          // Ensure metadata collection never breaks original functionality
        }

        try {
          super.send(body);
        } catch (e) {
          // If super.send fails, throw the original error
          throw e;
        }
      }
    };
  } catch (e) {
    // If override fails, ensure original XHR remains unchanged
    window.XMLHttpRequest = originalXHR;
  }
};

export const restoreXHR = () => {
  try {
    window.XMLHttpRequest = originalXHR;
  } catch (e) {
    // Silently handle restoration errors
  }
};
