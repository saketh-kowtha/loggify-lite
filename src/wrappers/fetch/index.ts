interface FetchMetadata {
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    queryParams: Record<string, string>;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: any;
  };
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

const originalFetch = window.fetch;

export const overrideFetch = () => {
  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const startTime = performance.now();
    const metadata: FetchMetadata = {
      request: {
        url: typeof input === 'string' ? input : input.toString(),
        method: init?.method || 'GET',
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

    // Parse query parameters from URL
    try {
      const url = new URL(metadata.request.url);
      url.searchParams.forEach((value, key) => {
        metadata.request.queryParams[key] = value;
      });
    } catch (e) {
      console.error('Invalid URL:', e);
    }

    // Collect request headers
    if (init?.headers) {
      const headerEntries: [string, string][] = [];
      const headers = new Headers(init.headers);
      headers.forEach((value, key) => {
        headerEntries.push([key, value]);
      });
      metadata.request.headers = Object.fromEntries(headerEntries);
    }

    // Collect request body
    if (init?.body) {
      try {
        metadata.request.body =
          typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      } catch (e) {
        metadata.request.body = init.body;
      }
    }

    const response = await originalFetch(input, init);
    const endTime = performance.now();

    // Collect response metadata
    metadata.response.status = response.status;
    metadata.response.statusText = response.statusText;

    const responseHeaderEntries: [string, string][] = [];
    response.headers.forEach((value, key) => {
      responseHeaderEntries.push([key, value]);
    });
    metadata.response.headers = Object.fromEntries(responseHeaderEntries);

    // Try to parse response body
    try {
      const clonedResponse = response.clone();
      metadata.response.body = await clonedResponse.json();
    } catch (e) {
      // Response body might not be JSON
      const clonedResponse = response.clone();
      metadata.response.body = await clonedResponse.text();
    }

    // Calculate timing
    metadata.timing.endTime = endTime;
    metadata.timing.duration = endTime - startTime;

    console.log('Fetch Metadata:', metadata);
    return response;
  };
};

export const restoreFetch = () => {
  window.fetch = originalFetch;
};
