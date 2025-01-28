import { EventType, FetchMetadata } from '../../types';
import handleEvent from '../../utils/handle-event';

const originalXHR = window.XMLHttpRequest;

export const overrideXHR = () => {
  try {
    window.XMLHttpRequest = class extends originalXHR {
      private metadata!: FetchMetadata;
      private startTime: number = 0;

      constructor() {
        super();
        try {
          this.metadata = {
            request: {
              url: '',
              method: '',
              headers: {},
              queryParams: {},
            },
            response: {
              status: 0,
              statusText: '',
              headers: {},
            },
            timing: {
              startTime: 0,
              endTime: 0,
              duration: 0,
            },
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

              // Try to parse response body
              try {
                if (this.responseText) {
                  this.metadata.response.body = JSON.parse(this.responseText);
                }
              } catch (e) {
                try {
                  this.metadata.response.body = this.responseText;
                } catch (textError) {
                  // If even getting responseText fails, we'll skip body
                }
              }

              // Send event to handler
              try {
                handleEvent({ type: EventType.FETCH, data: this.metadata });
              } catch (e) {
                // Silently handle event sending errors
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
            } catch (e) {
              this.metadata.request.body = body;
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
