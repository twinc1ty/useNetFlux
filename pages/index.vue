<template>
  <div class="flex flex-col h-screen bg-slate-950 text-slate-100 font-mono">

    <!-- Top Nav -->
    <header class="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
      <div class="flex-col items-center gap-3">
        <span class="header-text-bold text-teal-400 text-xl tracking-tight">useNetFlux</span>
        <span class="hidden sm:block text-slate-600 text-xs mt-1">v1.0.0</span>
      </div>

      <nav class="flex items-center gap-1">
        <button v-for="item in menuItems" :key="item.title" @click="currentTab = item.title"
          class="relative px-4 py-1.5 text-sm rounded-md transition-colors" :class="currentTab === item.title
            ? 'text-teal-400 bg-teal-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'">
          {{ item.title }}
        </button>
      </nav>
    </header>

    <!-- Sliding content -->
    <div class="flex-1 relative overflow-hidden">
      <Transition name="slide" mode="out-in">

        <!-- Home tab -->
        <div v-if="currentTab === 'Home'" key="home" class="absolute inset-0 overflow-y-auto">
          <div class="max-w-7xl mx-auto px-6 py-10 space-y-8">

            <div class="space-y-2">
              <h1 class="header-text-bold text-3xl text-teal-400">useNetFlux</h1>
              <p class="text-slate-400 text-sm leading-relaxed">
                A powerful network composable &amp; lightweight API playground built with Nuxt.
              </p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div v-for="feature in features" :key="feature.label"
                class="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div class="text-teal-400 mb-1.5">
                  <span v-html="feature.icon" />
                </div>
                <p class="text-xs font-bold text-slate-200 mb-0.5">{{ feature.label }}</p>
                <p class="text-xs text-slate-500 leading-relaxed">{{ feature.desc }}</p>
              </div>
            </div>

            <div class="border-t border-slate-800 pt-8">
              <h2 class="text-sm font-bold text-slate-300 mb-4">Why useNetFlux?</h2>
              <div class="text-sm text-slate-400 leading-7 space-y-4">
                <p>
                  While working on one a project; I came accross a problem where we had tabs to change the UI; and
                  whenever you'd click on a tab, it would make a new network request to fetch and show new data of that
                  respective tab. Now, if you do it slow enough, it would switch the tab and show a preloader while it
                  fetched the data from the API.
                </p>

                <p>
                  But the problem arose if you click tabs quickly, and switched between them fast-enough. This lead to
                  each click triggering an API call; and when the user finally stopped switching between the tabs - it
                  lead to completion of each request one by one - which in turn lead to the data in the UI getting
                  updated in sequence as each API request was resolving a successful response, one-by-one and updating
                  the local response state as well.
                </p>
                <p>
                  This was obviously bad user experience, but more than that - it was bad handling of APIs itself. Now,
                  one may suggest that I could simply debouce the API requests using setTimeout or use lodash debounce
                  function to handle this, but I wanted more control over my API requests. I wanted an architecture in
                  my API request process and control over the requests which would allow me to abort/cancel the previous
                  on going APIrequest and instead make a new, updated API request.
                </p>
                <p>
                  There are libraries like TanStack Query, React Query, SWR etc. which provide control over the requests
                  but I dont want to a library that requires me to "learn" it. All of these libraries come with a lot of
                  features out of the box and I am not looking for that. I just want a simple solution to handle my API
                  requests and have control over them.
                </p>
                <p>
                  So <span class="text-teal-400 font-bold">useNetFlux</span> was born.
                </p>
              </div>
              <a href="https://twinc1ty.tech/blog/the-usenetflux" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1.5 mt-5 text-sm text-teal-400 hover:text-teal-300 transition-colors">
                Read the full writeup
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </a>
            </div>

            <!-- CTA -->
            <div
              class="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p class="text-sm font-bold text-slate-200 mb-1">Ready to try it?</p>
                <p class="text-xs text-slate-500">Fire real requests and explore every feature live.</p>
              </div>
              <button @click="currentTab = 'Playground'"
                class="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold text-sm rounded-lg transition-colors">
                Open Playground
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>

          </div>
        </div>

        <!-- Playground tab -->
        <div v-else-if="currentTab === 'Playground'" key="playground" class="absolute inset-0 overflow-hidden">
          <ClientOnly>
            <Playground />
          </ClientOnly>
        </div>

        <!-- Documentation tab -->
        <div v-else key="documentation" class="absolute inset-0 overflow-y-auto">
          <div class="max-w-4xl mx-auto px-6 py-10">
            <ContentRenderer v-if="doc" :value="doc" class="docs-content" />
          </div>
        </div>

      </Transition>
    </div>

  </div>
</template>

<script setup lang="ts">
import Playground from "./playground.vue";

const menuItems = [{ title: "Home" }, { title: "Playground" }, { title: "Documentation" }];
const currentTab = ref("Home");

const { data: doc } = await useAsyncData("documentation", () =>
  queryContent("/documentation").findOne()
);

const features = [
  { label: "Request Queue", desc: "Prevent duplicate concurrent requests", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>` },
  { label: "Auto Retry", desc: "Configurable retries with delay backoff", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-3.84"></path></svg>` },
  { label: "Response Cache", desc: "TTL-based cache with skip-cache override", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>` },
  { label: "Timeout", desc: "Per-request abort after configurable ms", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>` },
  { label: "Cancellation", desc: "AbortController-based request cancellation", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>` },
  { label: "Override Mode", desc: "Abort in-flight request to start a fresh one", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>` },
];
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(24px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}

.docs-content :deep(h1) {
  @apply header-text-bold text-3xl text-teal-400 mb-4;
}

.docs-content :deep(h2) {
  @apply text-xl font-bold text-slate-200 mt-10 mb-3 pb-2 border-b border-slate-800;
}

.docs-content :deep(h3) {
  @apply text-base font-bold text-slate-200 mt-6 mb-2;
}

.docs-content :deep(p) {
  @apply text-sm text-slate-400 leading-7 mb-4;
}

.docs-content :deep(ul),
.docs-content :deep(ol) {
  @apply text-sm text-slate-400 leading-7 mb-4 pl-5 space-y-1;
}

.docs-content :deep(ul) {
  @apply list-disc;
}

.docs-content :deep(ol) {
  @apply list-decimal;
}

.docs-content :deep(a) {
  @apply text-teal-400 hover:text-teal-300 transition-colors;
}

.docs-content :deep(code) {
  @apply text-teal-300 bg-slate-900 px-1.5 py-0.5 rounded text-xs;
}

.docs-content :deep(pre) {
  @apply bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4 overflow-x-auto;
}

.docs-content :deep(pre code) {
  @apply bg-transparent p-0 text-slate-200;
}

.docs-content :deep(blockquote) {
  @apply border-l-2 border-teal-500/50 pl-4 text-slate-500 italic mb-4;
}

.docs-content :deep(hr) {
  @apply border-slate-800 my-8;
}

.docs-content :deep(table) {
  @apply w-full text-sm text-slate-400 mb-4 border-collapse;
}

.docs-content :deep(th),
.docs-content :deep(td) {
  @apply border border-slate-800 px-3 py-2 text-left;
}

.docs-content :deep(th) {
  @apply text-slate-200 bg-slate-900;
}
</style>
