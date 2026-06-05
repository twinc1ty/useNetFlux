<template>
  <div class="space-y-1.5">
    <div v-if="rows.length === 0" class="py-6 text-center text-slate-500 text-sm">
      No {{ itemLabel }}s added yet
    </div>

    <div v-for="row in rows" :key="row.id" class="flex items-center gap-2">
      <input
        type="checkbox"
        v-model="row.enabled"
        class="w-3.5 h-3.5 accent-teal-400 flex-shrink-0 cursor-pointer"
      />
      <input
        v-model="row.key"
        :placeholder="keyPlaceholder"
        class="flex-1 min-w-0 bg-slate-950 text-slate-200 text-sm px-3 py-1.5 rounded border border-slate-700 outline-none focus:border-teal-500/60 transition-colors placeholder:text-slate-600"
      />
      <input
        v-model="row.value"
        :placeholder="valuePlaceholder"
        class="flex-1 min-w-0 bg-slate-950 text-slate-200 text-sm px-3 py-1.5 rounded border border-slate-700 outline-none focus:border-teal-500/60 transition-colors placeholder:text-slate-600"
      />
      <button
        @click="$emit('remove', row.id)"
        class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors rounded"
        title="Remove"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <button
      @click="$emit('add')"
      class="mt-2 flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-sm transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add {{ itemLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { KeyValueRow } from "~/stores/playground-opt.store";

defineProps<{
  rows: KeyValueRow[];
  itemLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}>();

defineEmits<{
  add: [];
  remove: [id: string];
}>();
</script>
