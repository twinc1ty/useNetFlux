import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useNetFlux, type HttpMethod, type ApiResponse } from "~/composable/useNetFlux";
import { parseCurl, type ParsedCurl } from "~/composable/useCurlParser";

export type RequestTab = "params" | "headers" | "body" | "settings";
export type ResponseTab = "pretty" | "raw" | "headers";

export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface HistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  timestamp: Date;
  status?: number;
  statusText?: string;
  responseTime?: number;
  ok?: boolean;
  response?: ApiResponse;
}

export const usePlaygroundStoreOpt = defineStore("playground", () => {
  const { executeCall, updateGlobalConfig } = useNetFlux();

  // Request state
  const endpoint = ref("https://dummyjson.com/products/1");
  const method = ref<HttpMethod>("GET");
  const queryParams = ref<KeyValueRow[]>([]);
  const headers = ref<KeyValueRow[]>([
    { id: "h1", key: "Content-Type", value: "application/json", enabled: true },
    { id: "h2", key: "Accept", value: "application/json", enabled: true },
  ]);
  const body = ref("");

  // UI state
  const activeRequestTab = ref<RequestTab>("params");
  const activeResponseTab = ref<ResponseTab>("pretty");
  const isLoading = ref(false);
  const methodDropdownOpen = ref(false);
  const historyOpen = ref(true);

  // Response state
  const response = ref<ApiResponse | null>(null);
  const requestError = ref<string | null>(null);

  // Request history (most recent first, max 50)
  const requestHistory = ref<HistoryItem[]>([]);

  // Per-request settings (mirrors defaultConfig)
  const settings = ref({
    timeout: 5000,
    retries: 3,
    retryDelay: 1000,
    cacheDuration: 0,
    skipCache: true,
    async: false,
    override: false,
    logging: true,
  });

  const httpMethods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  const methodMeta: Record<HttpMethod, { color: string; bg: string; border: string }> = {
    GET:    { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    POST:   { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30" },
    PUT:    { color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30" },
    PATCH:  { color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/30" },
    DELETE: { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30" },
  };

  const hasBody = computed(() => ["POST", "PUT", "PATCH", "DELETE"].includes(method.value));
  const activeParamsCount = computed(() => queryParams.value.filter(p => p.enabled && p.key).length);
  const activeHeadersCount = computed(() => headers.value.filter(h => h.enabled && h.key).length);

  const enabledHeaders = computed(() =>
    headers.value
      .filter(h => h.enabled && h.key)
      .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {} as Record<string, string>)
  );

  const enabledQueryParams = computed(() =>
    queryParams.value
      .filter(p => p.enabled && p.key)
      .reduce((acc, p) => ({ ...acc, [p.key]: p.value }), {} as Record<string, string>)
  );

  function addQueryParam() {
    queryParams.value.push({ id: Date.now().toString(), key: "", value: "", enabled: true });
  }

  function removeQueryParam(id: string) {
    queryParams.value = queryParams.value.filter(p => p.id !== id);
  }

  function addHeader() {
    headers.value.push({ id: Date.now().toString(), key: "", value: "", enabled: true });
  }

  function removeHeader(id: string) {
    headers.value = headers.value.filter(h => h.id !== id);
  }

  function setMethod(m: HttpMethod) {
    method.value = m;
    methodDropdownOpen.value = false;
    if (m === "GET" && activeRequestTab.value === "body") {
      activeRequestTab.value = "params";
    }
  }

  function loadFromHistory(item: HistoryItem) {
    endpoint.value = item.url;
    method.value = item.method;
    requestError.value = null;
    response.value = item.response ?? null;
    if (item.response) activeResponseTab.value = "pretty";
  }

  function clearHistory() {
    requestHistory.value = [];
  }

  function importFromCurl(parsed: ParsedCurl) {
    endpoint.value = parsed.endpoint;
    if (parsed.method && httpMethods.includes(parsed.method as HttpMethod)) {
      method.value = parsed.method as HttpMethod;
    }

    if (parsed.headers.length) {
      headers.value = parsed.headers.map((h, idx) => ({
        id: `curl-h${idx}-${Date.now()}`,
        key: h.key,
        value: h.value,
        enabled: true,
      }));
    }

    if (parsed.queryParams.length) {
      queryParams.value = parsed.queryParams.map((p, idx) => ({
        id: `curl-p${idx}-${Date.now()}`,
        key: p.key,
        value: p.value,
        enabled: true,
      }));
    }

    body.value = parsed.body;

    if (parsed.body && ["POST", "PUT", "PATCH", "DELETE"].includes(parsed.method)) {
      activeRequestTab.value = "body";
    } else if (parsed.queryParams.length) {
      activeRequestTab.value = "params";
    } else if (parsed.headers.length) {
      activeRequestTab.value = "headers";
    }

    response.value = null;
    requestError.value = null;
  }

  // Keep globalConfig.logging in sync with settings
  watch(() => settings.value.logging, (val) => {
    updateGlobalConfig({ logging: val });
  });

  async function sendRequest() {
    if (!endpoint.value.trim()) return;

    isLoading.value = true;
    response.value = null;
    requestError.value = null;

    let parsedBody: any = undefined;
    if (hasBody.value && body.value.trim()) {
      try {
        parsedBody = JSON.parse(body.value);
      } catch {
        parsedBody = body.value;
      }
    }

    try {
      const result = await executeCall({
        apiRequest: {
          method: method.value,
          endpoint: endpoint.value.trim(),
          headers: enabledHeaders.value,
          queryParams: enabledQueryParams.value,
          body: parsedBody,
        },
        timeout: settings.value.timeout,
        retries: settings.value.retries,
        retryDelay: settings.value.retryDelay,
        cacheDuration: settings.value.cacheDuration,
        skipCache: settings.value.skipCache,
        async: settings.value.async,
        override: settings.value.override,
      });

      response.value = result;
      activeResponseTab.value = "pretty";

      if (!result.fromCache) {
        requestHistory.value.unshift({
          id: Date.now().toString(),
          method: method.value,
          url: endpoint.value.trim(),
          timestamp: new Date(),
          status: result.status,
          statusText: result.statusText,
          responseTime: result.responseTime,
          ok: result.ok,
          response: result,
        });
      }

      if (requestHistory.value.length > 50) {
        requestHistory.value = requestHistory.value.slice(0, 50);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        requestError.value = err.message || "Request failed";
        requestHistory.value.unshift({
          id: Date.now().toString(),
          method: method.value,
          url: endpoint.value.trim(),
          timestamp: new Date(),
          ok: false,
        });
      }
    } finally {
      isLoading.value = false;
    }
  }

  return {
    endpoint,
    method,
    queryParams,
    headers,
    body,
    activeRequestTab,
    activeResponseTab,
    isLoading,
    methodDropdownOpen,
    historyOpen,
    response,
    requestError,
    requestHistory,
    settings,
    httpMethods,
    methodMeta,
    hasBody,
    activeParamsCount,
    activeHeadersCount,
    enabledHeaders,
    enabledQueryParams,
    addQueryParam,
    removeQueryParam,
    addHeader,
    removeHeader,
    setMethod,
    loadFromHistory,
    clearHistory,
    importFromCurl,
    parseCurl,
    sendRequest,
    updateGlobalConfig,
  };
});
