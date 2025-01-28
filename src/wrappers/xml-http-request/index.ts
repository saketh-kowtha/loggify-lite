import { FetchMetadata } from '../../types';

const originalXHR = window.XMLHttpRequest;

export const overrideXHR = () => {
  window.XMLHttpRequest = class extends originalXHR {
    private metadata: FetchMetadata;
    private startTime: number = 0;

    constructor() {
      super();
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
        const endTime = performance.now();
        this.metadata.timing.endTime = endTime;
        this.metadata.timing.duration = endTime - this.startTime;

        // Collect response metadata
        this.metadata.response.status = this.status;
        this.metadata.response.statusText = this.statusText;

        // Parse response headers
        const headerString = this.getAllResponseHeaders();
        const headerPairs = headerString.split('\r\n').filter(Boolean);
        this.metadata.response.headers = headerPairs.reduce(
          (acc, curr) => {
            const [key, value] = curr.split(': ');
            acc[key.toLowerCase()] = value;
            return acc;
          },
          {} as Record<string, string>,
        );

        // Try to parse response body
        try {
          this.metadata.response.body = JSON.parse(this.responseText);
        } catch (e) {
          this.metadata.response.body = this.responseText;
        }

        console.log('XMLHttpRequest Metadata:', this.metadata);
      });
    }

    open(method: string, url: string, ...args: any[]) {
      this.startTime = performance.now();
      this.metadata.timing.startTime = this.startTime;
      this.metadata.request.method = method;
      this.metadata.request.url = url;

      // Parse query parameters from URL
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.forEach((value, key) => {
          this.metadata.request.queryParams[key] = value;
        });
      } catch (e) {
        console.error('Invalid URL:', e);
      }
      // @ts-ignore
      super.open(method, url, ...args);
    }

    setRequestHeader(header: string, value: string) {
      this.metadata.request.headers[header.toLowerCase()] = value;
      super.setRequestHeader(header, value);
    }

    send(body?: Document | XMLHttpRequestBodyInit | null) {
      if (body) {
        try {
          this.metadata.request.body =
            typeof body === 'string' ? JSON.parse(body) : body;
        } catch (e) {
          this.metadata.request.body = body;
        }
      }
      super.send(body);
    }
  };
};

export const restoreXHR = () => {
  window.XMLHttpRequest = originalXHR;
};
