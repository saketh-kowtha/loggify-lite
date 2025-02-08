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
    let response: Response;

    const metadata: FetchMetadata = {
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

    // Silently collect request data without affecting original fetch
    try {
      metadata.request.url =
        typeof input === 'string' ? input : input.toString();
      metadata.request.method = init?.method || 'GET';

      // Parse cookies
      try {
        metadata.request.cookies = document.cookie
          ? Object.fromEntries(
              document.cookie.split(';').map((cookie) => {
                const [key, value] = cookie.trim().split('=');
                return [key, value];
              }),
            )
          : {};
      } catch {}

      // Parse query params
      try {
        const url = new URL(metadata.request.url);
        url.searchParams.forEach((value, key) => {
          metadata.request.queryParams[key] = value;
        });
      } catch {}

      // Parse headers
      if (init?.headers) {
        try {
          const headers = new Headers(init.headers);
          const headerEntries: [string, string][] = [];
          headers.forEach((value, key) => headerEntries.push([key, value]));
          metadata.request.headers = Object.fromEntries(headerEntries);
          metadata.request.headersSize = Object.entries(
            metadata.request.headers,
          ).reduce(
            (size, [key, value]) => size + key.length + value.length + 4,
            0,
          );
        } catch {}
      }

      // Parse body
      if (init?.body) {
        try {
          metadata.request.body =
            typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
        } catch {
          metadata.request.body = init.body;
        }
        metadata.request.bodySize = init.body.toString().length;
      }
    } catch {}

    try {
      const fetchStartTime = performance.now();
      response = await originalFetch(input, init);
      const fetchEndTime = performance.now();

      // Silently collect response data
      try {
        metadata.response.status = response.status;
        metadata.response.statusText = response.statusText;

        // Headers
        const headerEntries: [string, string][] = [];
        response.headers.forEach((value, key) =>
          headerEntries.push([key, value]),
        );
        metadata.response.headers = Object.fromEntries(headerEntries);
        metadata.response.headersSize = Object.entries(
          metadata.response.headers,
        ).reduce(
          (size, [key, value]) => size + key.length + value.length + 4,
          0,
        );

        // Body
        const clonedResponse = response.clone();
        const responseBody = await clonedResponse.text();
        metadata.response.content.text = responseBody;
        metadata.response.content.size = responseBody.length;
        metadata.response.bodySize = responseBody.length;
        metadata.response.content.mimeType =
          response.headers.get('content-type') || '';

        // Timing
        const endTime = performance.now();
        metadata.timing.endTime = endTime;
        metadata.timing.duration = endTime - startTime;
        metadata.timing.wait = fetchEndTime - fetchStartTime;
        metadata.timing.send = fetchStartTime - startTime;
        metadata.timing.receive = endTime - fetchEndTime;
      } catch {}

      if (store.getConfig().allowNetworkRequests) {
        handleEvent({ type: EventType.FETCH, data: metadata });
      }

      return response;
    } catch (error) {
      metadata.error = error as Error;
      if (store.getConfig().allowNetworkRequests) {
        handleEvent({ type: EventType.FETCH, data: metadata });
      }
      throw error;
    }
  };
};

export const restoreFetch = () => {
  try {
    window.fetch = originalFetch;
  } catch {}
};
