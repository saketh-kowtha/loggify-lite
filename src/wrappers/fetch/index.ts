import handleEvent from '../../utils/handle-event';
import { EventType, FetchMetadata } from '../../types';
import store from '../../store';

const originalFetch = window.fetch;

export const overrideFetch = () => {
  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const startTime = performance.now();

    const metadata: FetchMetadata = {
      request: {
        url: '',
        method: 'GET',
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
        startTime,
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

    try {
      // Safely set request URL
      try {
        metadata.request.url =
          typeof input === 'string' ? input : input.toString();
      } catch (e) {
        // console.warn('Failed to parse request URL:', e);
      }

      // Safely set request method
      try {
        metadata.request.method = init?.method || 'GET';
      } catch (e) {
        // console.warn('Failed to parse request method:', e);
      }

      // Parse query parameters from URL
      try {
        const url = new URL(metadata.request.url);
        url.searchParams.forEach((value, key) => {
          metadata.request.queryParams[key] = value;
        });
      } catch (e) {
        // console.warn('Failed to parse URL parameters:', e);
      }

      // Collect request headers
      try {
        if (init?.headers) {
          const headerEntries: [string, string][] = [];
          const headers = new Headers(init.headers);
          headers.forEach((value, key) => {
            headerEntries.push([key, value]);
          });
          metadata.request.headers = Object.fromEntries(headerEntries);
          metadata.request.headersSize = Object.entries(
            metadata.request.headers,
          ).reduce(
            (size, [key, value]) => size + key.length + value.length + 4,
            0,
          );
        }
      } catch (e) {
        // console.warn('Failed to collect request headers:', e);
      }

      // Collect request body
      try {
        if (init?.body) {
          metadata.request.body =
            typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
          metadata.request.bodySize = init.body.toString().length;
        }
      } catch (e) {
        // console.warn('Failed to parse request body:', e);
        metadata.request.body = init?.body;
        if (init?.body) {
          metadata.request.bodySize = init.body.toString().length;
        }
      }

      let response: Response;
      const fetchStartTime = performance.now();
      try {
        response = await originalFetch(input, init);
      } catch (e) {
        throw e; // Re-throw to maintain original error behavior
      }
      const fetchEndTime = performance.now();

      // Collect response metadata
      try {
        metadata.response.status = response.status;
        metadata.response.statusText = response.statusText;

        const responseHeaderEntries: [string, string][] = [];
        response.headers.forEach((value, key) => {
          responseHeaderEntries.push([key, value]);
        });
        metadata.response.headers = Object.fromEntries(responseHeaderEntries);
        metadata.response.headersSize = Object.entries(
          metadata.response.headers,
        ).reduce(
          (size, [key, value]) => size + key.length + value.length + 4,
          0,
        );
      } catch (e) {
        // console.warn('Failed to collect response metadata:', e);
      }

      // Try to parse response body
      try {
        const clonedResponse = response.clone();
        const responseBody = await clonedResponse.text();
        metadata.response.content.text = responseBody;
        metadata.response.content.size = responseBody.length;
        metadata.response.bodySize = responseBody.length;
        metadata.response.content.mimeType =
          response.headers.get('content-type') || '';
      } catch (e) {
        // console.warn('Failed to parse response body:', e);
      }

      // Calculate timing
      try {
        const endTime = performance.now();
        metadata.timing.endTime = endTime;
        metadata.timing.duration = endTime - startTime;
        metadata.timing.wait = fetchEndTime - fetchStartTime;
        metadata.timing.send = fetchStartTime - startTime;
        metadata.timing.receive = endTime - fetchEndTime;
      } catch (e) {
        // console.warn('Failed to calculate timing:', e);
      }

      if (store.getConfig().allowNetworkRequests)
        handleEvent({ type: EventType.FETCH, data: metadata });

      return response;
    } catch (error) {
      handleEvent({ type: EventType.FETCH, data: metadata });
      //   console.error('Fatal error in fetch wrapper:', error);
      // Fallback to original fetch in case of any unexpected errors
      return originalFetch(input, init);
    }
  };
};

export const restoreFetch = () => {
  try {
    window.fetch = originalFetch;
  } catch (e) {
    // console.error('Failed to restore original fetch:', e);
  }
};
