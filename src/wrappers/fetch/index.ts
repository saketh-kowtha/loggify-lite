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
      },
      response: {
        status: 0,
        statusText: '',
        headers: {},
      },
      timing: {
        startTime,
        endTime: 0,
        duration: 0,
      },
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
        }
      } catch (e) {
        // console.warn('Failed to collect request headers:', e);
      }

      // Collect request body
      try {
        if (init?.body) {
          metadata.request.body =
            typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
        }
      } catch (e) {
        // console.warn('Failed to parse request body:', e);
        metadata.request.body = init?.body;
      }

      let response: Response;
      try {
        response = await originalFetch(input, init);
      } catch (e) {
        throw e; // Re-throw to maintain original error behavior
      }

      const endTime = performance.now();

      // Collect response metadata
      try {
        metadata.response.status = response.status;
        metadata.response.statusText = response.statusText;

        const responseHeaderEntries: [string, string][] = [];
        response.headers.forEach((value, key) => {
          responseHeaderEntries.push([key, value]);
        });
        metadata.response.headers = Object.fromEntries(responseHeaderEntries);
      } catch (e) {
        // console.warn('Failed to collect response metadata:', e);
      }

      // Try to parse response body
      try {
        const clonedResponse = response.clone();
        metadata.response.body = await clonedResponse.json();
      } catch (e) {
        try {
          const clonedResponse = response.clone();
          metadata.response.body = await clonedResponse.text();
        } catch (textError) {
          //   console.warn('Failed to parse response body:', textError);
        }
      }

      // Calculate timing
      try {
        metadata.timing.endTime = endTime;
        metadata.timing.duration = endTime - startTime;
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
