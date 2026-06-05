import { ref } from "vue";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiRequest {
  method: HttpMethod;
  endpoint: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number>;
  body?: any;
}

export interface ApiResponse {
  data: any;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseTime: number;
  size: number;
  ok: boolean;
  contentType: string;
  fromCache?: boolean;
}

interface ExecuteCallParams {
  apiRequest: ApiRequest;
  async?: boolean;
  override?: boolean;
  retries?: number;
  retryDelay?: number;
  cancellationToken?: AbortController;
  timeout?: number;
  cacheDuration?: number;
  skipCache?: boolean;
}

export const defaultConfig = ref({
  retries: 3,
  retryDelay: 1000,
  timeout: 5000,
  cacheDuration: 60000,
  async: false,
  override: false,
  skipCache: false,
  logging: true,
});

export function useNetFlux() {
  const requestQueue = ref(new Map<string, { controller: AbortController; promise: Promise<ApiResponse> }>());
  const cacheStore = ref(new Map<string, { data: ApiResponse; timestamp: number }>());

  function log(level: "info" | "warn" | "error", message: string, ...details: any[]) {
    if (defaultConfig.value.logging) {
      const timestamp = new Date().toISOString();
      console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, ...details);
    }
  }

  function createTimeoutAbortController(timeout: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      log("warn", `Request timed out after ${timeout}ms`);
    }, timeout);
    return { controller, clearTimeout: () => clearTimeout(timeoutId) };
  }

  function generateCacheKey(url: string, queryParams: Record<string, string | number>) {
    const queryString = new URLSearchParams(queryParams as any).toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  function isCacheValid(cacheTimestamp: number, cacheDuration: number) {
    return Date.now() - cacheTimestamp < cacheDuration;
  }

  async function attemptNetworkCall(params: ExecuteCallParams, attempt: number): Promise<ApiResponse> {
    const { apiRequest, retries, retryDelay, cancellationToken, timeout, cacheDuration, skipCache } = params;
    const { method, endpoint, headers = {}, queryParams = {}, body } = apiRequest;

    const cacheKey = generateCacheKey(endpoint, queryParams);

    if (!skipCache && cacheDuration && cacheDuration > 0) {
      const cached = cacheStore.value.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp, cacheDuration)) {
        log("info", `Returning cached response for: ${cacheKey}`);
        return { ...cached.data, fromCache: true };
      }
    }

    let controller = cancellationToken || new AbortController();
    let timeoutCleanup: (() => void) | undefined;

    if (timeout) {
      const tc = createTimeoutAbortController(timeout);
      controller = tc.controller;
      timeoutCleanup = tc.clearTimeout;
    }

    try {
      const startTime = Date.now();
      const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        signal: controller.signal,
      };

      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && body !== undefined && body !== null) {
        options.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      log("info", `Attempting network call`, { endpoint, method, attempt });

      const rawResponse = await fetch(endpoint, options);
      const responseTime = Date.now() - startTime;

      const responseHeaders: Record<string, string> = {};
      rawResponse.headers.forEach((value, key) => { responseHeaders[key] = value; });

      const contentType = rawResponse.headers.get("content-type") || "";
      const text = await rawResponse.text();
      const size = new TextEncoder().encode(text).length;

      let data: any;
      if (contentType.includes("application/json")) {
        try { data = JSON.parse(text); } catch { data = text; }
      } else {
        data = text;
      }

      const apiResponse: ApiResponse = {
        data,
        status: rawResponse.status,
        statusText: rawResponse.statusText,
        responseHeaders,
        responseTime,
        size,
        ok: rawResponse.ok,
        contentType,
      };

      log("info", `Network call complete`, { endpoint, status: rawResponse.status, responseTime });

      if (cacheDuration && cacheDuration > 0 && rawResponse.ok) {
        cacheStore.value.set(cacheKey, { data: apiResponse, timestamp: Date.now() });
        log("info", `Response cached for: ${cacheKey}`, { cacheDuration });
      }

      return apiResponse;
    } catch (error: any) {
      if (error.name === "AbortError") {
        log("warn", "Request aborted:", { endpoint });
        throw error;
      }

      log("error", "Request failed:", { error: error.message, endpoint, attempt });

      if (retries && attempt < retries) {
        log("warn", `Retrying... Attempt ${attempt + 1}/${retries}`, { endpoint, retryDelay });
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return attemptNetworkCall(params, attempt + 1);
      }

      throw error;
    } finally {
      if (timeoutCleanup) timeoutCleanup();
    }
  }

  async function executeCall(params: ExecuteCallParams): Promise<ApiResponse> {
    const { apiRequest, async: asyncMode, override, retries, retryDelay, cancellationToken, timeout, cacheDuration, skipCache } = params;
    const { method, endpoint, queryParams = {} } = apiRequest;

    const merged = {
      async: asyncMode ?? defaultConfig.value.async,
      override: override ?? defaultConfig.value.override,
      retries: retries ?? defaultConfig.value.retries,
      retryDelay: retryDelay ?? defaultConfig.value.retryDelay,
      timeout: timeout ?? defaultConfig.value.timeout,
      cacheDuration: cacheDuration ?? defaultConfig.value.cacheDuration,
      skipCache: skipCache ?? defaultConfig.value.skipCache,
    };

    const queryString = new URLSearchParams(queryParams as any).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    log("info", `Starting API call`, { url, method, ...merged });

    if (requestQueue.value.has(url)) {
      if (merged.override) {
        requestQueue.value.get(url)!.controller.abort();
        requestQueue.value.delete(url);
        log("info", `Aborted ongoing request for: ${url}`);
      } else if (!merged.async) {
        log("info", `Waiting for ongoing request: ${url}`);
        try { await requestQueue.value.get(url)!.promise; } catch {}
      }
    }

    const callController = cancellationToken || new AbortController();
    const callParams: ExecuteCallParams = {
      ...params,
      retries: merged.retries,
      retryDelay: merged.retryDelay,
      timeout: merged.timeout,
      cacheDuration: merged.cacheDuration,
      // override implies a fresh fetch — bypassing cache makes no sense to skip here
      skipCache: merged.override ? true : merged.skipCache,
    };
    const callPromise = attemptNetworkCall(callParams, 0);

    requestQueue.value.set(url, { controller: callController, promise: callPromise });

    try {
      const result = await callPromise;
      log("info", `API call completed: ${url}`, { status: result.status });
      return result;
    } catch (error) {
      log("error", `API call failed: ${url}`, { error });
      throw error;
    } finally {
      requestQueue.value.delete(url);
    }
  }

  function updateGlobalConfig(newConfig: Partial<typeof defaultConfig.value>) {
    defaultConfig.value = { ...defaultConfig.value, ...newConfig };
    log("info", `Global config updated`, { newConfig });
  }

  return { executeCall, updateGlobalConfig };
}
