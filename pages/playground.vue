. <template>
  <div class="flex h-full bg-slate-950 text-slate-100 font-mono text-sm" @click="closeDropdowns">

    <!-- History Sidebar -->
    <Transition name="sidebar">
      <aside v-if="store.historyOpen"
        class="w-56 flex-shrink-0 border-r border-slate-800 flex flex-col bg-slate-950 overflow-hidden">
        <div class="flex items-center justify-between px-3 py-2.5 border-b border-slate-800">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">History</span>
          <button v-if="store.requestHistory.length > 0" @click.stop="store.clearHistory"
            class="text-xs text-slate-600 hover:text-red-400 transition-colors">
            Clear
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="store.requestHistory.length === 0"
            class="px-3 py-6 text-center text-slate-600 text-xs leading-relaxed">
            Requests will<br />appear here
          </div>

          <button v-for="item in store.requestHistory" :key="item.id" @click.stop="store.loadFromHistory(item)"
            class="w-full text-left px-3 py-2.5 border-b border-slate-800/60 hover:bg-slate-900 transition-colors group">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-xs font-bold shrink-0" :class="store.methodMeta[item.method].color">
                {{ item.method }}
              </span>
              <span v-if="item.status" class="text-xs shrink-0" :class="item.ok ? 'text-emerald-400' : 'text-red-400'">
                {{ item.status }}
              </span>
              <span v-else class="text-xs text-red-400 shrink-0">ERR</span>
            </div>
            <p class="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors">
              {{ stripProtocol(item.url) }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-slate-600">{{ timeAgo(item.timestamp) }}</span>
              <span v-if="item.responseTime" class="text-xs text-slate-600">{{ item.responseTime }}ms</span>
            </div>
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Main Panel -->
    <div class="flex-1 min-w-0 overflow-y-auto">
      <div class="p-4 space-y-3">

        <!-- URL Bar -->
        <div class="flex gap-2 bg-slate-900 rounded-lg p-1.5 border border-slate-800 shadow-lg">
          <!-- History toggle -->
          <button @click.stop="store.historyOpen = !store.historyOpen"
            class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
            :title="store.historyOpen ? 'Hide history' : 'Show history'">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>

          <!-- Method dropdown -->
          <div class="relative flex-shrink-0" @click.stop>
            <button @click="store.methodDropdownOpen = !store.methodDropdownOpen"
              class="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold min-w-[86px] border transition-colors"
              :class="[store.methodMeta[store.method].bg, store.methodMeta[store.method].border, store.methodMeta[store.method].color]">
              <span>{{ store.method }}</span>
              <svg class="ml-auto" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <Transition name="dropdown">
              <div v-if="store.methodDropdownOpen"
                class="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-20 overflow-hidden min-w-[110px]">
                <button v-for="m in store.httpMethods" :key="m" @click="store.setMethod(m)"
                  class="flex items-center w-full px-3 py-2 hover:bg-slate-800 text-sm font-bold transition-colors"
                  :class="[store.methodMeta[m].color, store.method === m ? store.methodMeta[m].bg : '']">
                  {{ m }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- URL input -->
          <input v-model="store.endpoint" @keyup.enter="store.sendRequest" placeholder="Enter request URL…"
            class="flex-1 min-w-0 bg-transparent text-slate-100 text-sm outline-none px-2 placeholder:text-slate-600" />

          <!-- Send button -->
          <button @click="store.sendRequest" :disabled="store.isLoading || !store.endpoint.trim()"
            class="px-5 py-2 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold rounded-md text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0">
            <svg v-if="store.isLoading" class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="13" height="13"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {{ store.isLoading ? "Sending" : "Send" }}
          </button>

          <!-- Import cURL button -->
          <button @click.stop="openCurlImport" title="Import cURL"
            class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-teal-400 hover:bg-slate-800 rounded-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </button>
        </div>

        <!-- Request Config -->
        <div class="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <div class="flex border-b border-slate-800">
            <TabButton v-for="tab in requestTabs" :key="tab.id" :active="store.activeRequestTab === tab.id"
              :count="tab.count" @click="store.activeRequestTab = tab.id">{{ tab.label }}</TabButton>
          </div>

          <div class="p-4">
            <div v-if="store.activeRequestTab === 'params'">
              <KeyValueEditor :rows="store.queryParams" item-label="parameter" key-placeholder="key"
                value-placeholder="value" @add="store.addQueryParam" @remove="store.removeQueryParam" />
            </div>

            <div v-else-if="store.activeRequestTab === 'headers'">
              <KeyValueEditor :rows="store.headers" item-label="header" key-placeholder="Header name"
                value-placeholder="Value" @add="store.addHeader" @remove="store.removeHeader" />
            </div>

            <div v-else-if="store.activeRequestTab === 'body'">
              <div v-if="!store.hasBody" class="py-6 text-center text-slate-500 text-sm">
                Body is not available for
                <span :class="store.methodMeta[store.method].color" class="font-bold">{{ store.method }}</span>
                requests
              </div>
              <JsonBodyEditor v-else v-model="store.body" />
            </div>

            <div v-else-if="store.activeRequestTab === 'settings'">
              <div class="space-y-5">
                <!-- Numeric fields -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div v-for="field in settingsFields" :key="field.key">
                    <label class="block text-xs text-slate-400 mb-0.5">{{ field.label }}</label>
                    <p class="text-xs text-slate-600 mb-1.5">{{ field.desc }}</p>
                    <div class="flex items-center gap-2">
                      <input v-model.number="store.settings[field.key as keyof typeof store.settings]" type="number"
                        :min="field.min" :step="field.step"
                        class="w-full bg-slate-950 text-slate-200 text-sm px-3 py-1.5 rounded border border-slate-700 outline-none focus:border-teal-500/60 transition-colors" />
                      <span class="text-xs text-slate-500 flex-shrink-0 w-16">{{ field.unit }}</span>
                    </div>
                  </div>
                </div>

                <!-- Boolean flags -->
                <div class="border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label v-for="flag in settingsFlags" :key="flag.key" :for="flag.key"
                    class="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                    :class="store.settings[flag.key as keyof typeof store.settings] ? 'bg-teal-500/5 border-teal-500/20' : ''">
                    <input :id="flag.key" type="checkbox"
                      v-model="store.settings[flag.key as keyof typeof store.settings]"
                      class="mt-0.5 w-3.5 h-3.5 accent-teal-400 cursor-pointer flex-shrink-0" />
                    <div>
                      <p class="text-sm text-slate-200 font-bold leading-none mb-1">{{ flag.label }}</p>
                      <p class="text-xs text-slate-500 leading-relaxed">{{ flag.desc }}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Response Panel -->
        <Transition name="fade-up">
          <div v-if="store.isLoading || store.response || store.requestError"
            class="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">

            <div v-if="store.isLoading" class="flex items-center justify-center py-14 gap-3 text-slate-500">
              <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span class="text-sm">Sending request…</span>
            </div>

            <template v-else>
              <div v-if="store.requestError" class="p-4">
                <div class="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <svg class="text-red-400 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="14"
                    height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <p class="text-red-400 text-sm font-bold mb-0.5">Request Failed</p>
                    <p class="text-red-300/70 text-xs font-mono break-all">{{ store.requestError }}</p>
                  </div>
                </div>
              </div>

              <div v-else-if="store.response">
                <!-- Status bar -->
                <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full flex-shrink-0" :class="statusDot(store.response.status)" />
                      <span class="text-sm font-bold" :class="statusColor(store.response.status)">
                        {{ store.response.status }} {{ store.response.statusText }}
                      </span>
                    </div>
                    <span class="text-slate-500 text-xs">{{ store.response.responseTime }}ms</span>
                    <span class="text-slate-500 text-xs">{{ formatSize(store.response.size) }}</span>
                  </div>
                  <button @click.stop="copyResponse"
                    class="text-xs text-slate-500 hover:text-slate-200 transition-colors flex items-center gap-1.5">
                    <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <svg v-else class="text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                      stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {{ copied ? "Copied!" : "Copy" }}
                  </button>
                </div>

                <!-- Response tabs -->
                <div class="flex border-b border-slate-800">
                  <TabButton v-for="tab in responseTabs" :key="tab.id" :active="store.activeResponseTab === tab.id"
                    @click="store.activeResponseTab = tab.id">{{ tab.label }}</TabButton>
                </div>

                <!-- Response content -->
                <div class="p-4">
                  <pre v-if="store.activeResponseTab === 'pretty'"
                    class="text-xs leading-5 overflow-auto max-h-[480px] whitespace-pre-wrap break-words"
                    v-html="highlightedJson" />
                  <pre v-else-if="store.activeResponseTab === 'raw'"
                    class="text-xs leading-5 text-slate-300 overflow-auto max-h-[480px] whitespace-pre-wrap break-words">{{ rawResponse }}</pre>
                  <div v-else-if="store.activeResponseTab === 'headers'">
                    <div v-for="(value, key) in store.response.responseHeaders" :key="key"
                      class="flex flex-wrap gap-x-6 gap-y-0.5 py-1.5 border-b border-slate-800/60 last:border-0">
                      <span class="text-teal-400 text-xs min-w-[180px]">{{ key }}</span>
                      <span class="text-slate-300 text-xs break-all">{{ value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </Transition>

      </div>
    </div>
  </div>

  <!-- cURL Import Modal -->
  <Transition name="modal">
    <div v-if="curlImportOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      @click.self="closeCurlImport">
      <div
        class="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col gap-0 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="text-teal-400">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            <span class="text-sm font-bold text-slate-200">Import cURL</span>
          </div>
          <button @click="closeCurlImport" class="text-slate-500 hover:text-slate-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Textarea -->
        <div class="p-4">
          <textarea ref="curlTextareaRef" v-model="curlInput"
            placeholder="Paste cURL command here…&#10;&#10;curl 'https://api.example.com/users' \&#10;  -H 'Authorization: Bearer token' \&#10;  -d '{&quot;name&quot;: &quot;John&quot;}'"
            spellcheck="false"
            class="w-full h-44 bg-slate-950 text-slate-200 text-xs font-mono px-3 py-2.5 rounded-lg border border-slate-700 outline-none focus:border-teal-500/60 resize-none placeholder:text-slate-600 transition-colors leading-5" />
          <p v-if="curlImportError" class="mt-2 text-xs text-red-400">{{ curlImportError }}</p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800">
          <button @click="closeCurlImport"
            class="px-4 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button @click="submitCurlImport" :disabled="!curlInput.trim()"
            class="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold text-sm rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Import
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { usePlaygroundStoreOpt } from "~/stores/playground-opt.store";

definePageMeta({ ssr: false });

const store = usePlaygroundStoreOpt();
const copied = ref(false);

const requestTabs = computed(() => [
  { id: "params", label: "Params", count: store.activeParamsCount },
  { id: "headers", label: "Headers", count: store.activeHeadersCount },
  { id: "body", label: "Body", count: 0 },
  { id: "settings", label: "Advanced", count: 0 },
] as const);

const responseTabs = [
  { id: "pretty", label: "Pretty" },
  { id: "raw", label: "Raw" },
  { id: "headers", label: "Headers" },
] as const;

const settingsFields = [
  { key: "timeout", label: "Timeout", desc: "Abort the request after this many ms. 0 = disabled.", unit: "ms", min: 0, step: 500 },
  { key: "retries", label: "Retries", desc: "How many times to retry on network failure before giving up.", unit: "attempts", min: 0, step: 1 },
  { key: "retryDelay", label: "Retry Delay", desc: "Wait this many ms between each retry attempt.", unit: "ms", min: 0, step: 100 },
  { key: "cacheDuration", label: "Cache Duration", desc: "Cache successful responses for this many ms. 0 = no cache.", unit: "ms", min: 0, step: 1000 },
];

const settingsFlags = [
  { key: "skipCache", label: "Skip Cache", desc: "Bypass the cache and always fetch a fresh response, even if a cached one exists." },
  { key: "async", label: "Async Mode", desc: "Allow a new request to fire in parallel if one is already in-flight for the same URL." },
  { key: "override", label: "Override", desc: "Abort any in-flight request to the same URL and immediately start a new one." },
  { key: "logging", label: "Logging", desc: "Print request lifecycle events to the browser console." },
];

function statusColor(status: number) {
  if (status >= 200 && status < 300) return "text-emerald-400";
  if (status >= 300 && status < 400) return "text-blue-400";
  if (status >= 400 && status < 500) return "text-amber-400";
  return "text-red-400";
}

function statusDot(status: number) {
  if (status >= 200 && status < 300) return "bg-emerald-400";
  if (status >= 300 && status < 400) return "bg-blue-400";
  if (status >= 400 && status < 500) return "bg-amber-400";
  return "bg-red-400";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "");
}

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const rawResponse = computed(() => {
  if (!store.response) return "";
  if (typeof store.response.data === "string") return store.response.data;
  return JSON.stringify(store.response.data, null, 2);
});

const highlightedJson = computed(() => {
  if (!store.response) return "";
  const raw = typeof store.response.data === "string"
    ? store.response.data
    : JSON.stringify(store.response.data, null, 2);
  return syntaxHighlight(raw);
});

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-amber-300";
        if (/^"/.test(match)) cls = /:$/.test(match) ? "text-teal-300" : "text-emerald-300";
        else if (/true|false/.test(match)) cls = "text-purple-400";
        else if (/null/.test(match)) cls = "text-slate-500";
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

async function copyResponse() {
  if (!store.response) return;
  const text = typeof store.response.data === "string"
    ? store.response.data
    : JSON.stringify(store.response.data, null, 2);
  await navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

function closeDropdowns() {
  store.methodDropdownOpen = false;
}

// cURL import
const curlImportOpen = ref(false);
const curlInput = ref("");
const curlImportError = ref("");
const curlTextareaRef = ref<HTMLTextAreaElement | null>(null);

function openCurlImport() {
  curlInput.value = "";
  curlImportError.value = "";
  curlImportOpen.value = true;
  nextTick(() => curlTextareaRef.value?.focus());
}

function closeCurlImport() {
  curlImportOpen.value = false;
}

function submitCurlImport() {
  curlImportError.value = "";
  const raw = curlInput.value.trim();
  if (!raw) return;

  try {
    const parsed = store.parseCurl(raw);
    if (!parsed.endpoint) {
      curlImportError.value = "Could not detect a URL in the cURL command.";
      return;
    }
    store.importFromCurl(parsed);
    closeCurlImport();
  } catch (e: any) {
    curlImportError.value = e?.message || "Failed to parse cURL command.";
  }
}
</script>

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: width 0.2s ease, opacity 0.2s ease;
  overflow: hidden;
}

.sidebar-enter-from,
.sidebar-leave-to {
  width: 0 !important;
  opacity: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-active .bg-slate-900,
.modal-leave-active .bg-slate-900 {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .bg-slate-900,
.modal-leave-to .bg-slate-900 {
  opacity: 0;
  transform: scale(0.97) translateY(-6px);
}
</style>
