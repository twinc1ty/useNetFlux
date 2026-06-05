<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">Body format:</span>
        <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">JSON</span>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="jsonError" class="text-xs text-red-400 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ jsonError }}
        </span>
        <span v-else-if="modelValue.trim()" class="text-xs text-emerald-400 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Valid JSON
        </span>
        <button
          v-if="modelValue.trim() && !jsonError"
          @click="formatBody"
          class="text-xs text-teal-400 hover:text-teal-300 transition-colors"
        >
          Prettify
        </button>
      </div>
    </div>

    <div class="relative rounded border transition-colors" :class="jsonError ? 'border-red-500/50' : 'border-slate-700 focus-within:border-teal-500/60'">
      <div class="flex">
        <!-- Line numbers -->
        <div
          ref="lineNumbers"
          class="select-none text-right text-slate-600 text-xs font-mono py-3 pl-2 pr-2 bg-slate-950 rounded-l border-r border-slate-800 min-w-[2.5rem] leading-5 overflow-hidden"
          aria-hidden="true"
        >
          <div v-for="n in lineCount" :key="n">{{ n }}</div>
        </div>
        <!-- Textarea -->
        <textarea
          ref="textarea"
          :value="modelValue"
          @input="onInput"
          @scroll="syncScroll"
          @keydown.tab.prevent="insertTab"
          placeholder='{\n  "key": "value"\n}'
          spellcheck="false"
          class="flex-1 bg-slate-950 text-slate-200 text-xs font-mono py-3 px-3 outline-none resize-none leading-5 min-h-[160px] rounded-r placeholder:text-slate-700"
          :style="{ height: textareaHeight }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const textarea = ref<HTMLTextAreaElement>();
const lineNumbers = ref<HTMLDivElement>();
const jsonError = ref("");
const textareaHeight = ref("160px");

const lineCount = computed(() => {
  const lines = props.modelValue.split("\n").length;
  return Math.max(lines, 8);
});

function onInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value;
  emit("update:modelValue", val);
  validateJson(val);
  adjustHeight();
}

function validateJson(val: string) {
  if (!val.trim()) { jsonError.value = ""; return; }
  try {
    JSON.parse(val);
    jsonError.value = "";
  } catch (err: any) {
    jsonError.value = err.message.split("\n")[0];
  }
}

function formatBody() {
  try {
    const formatted = JSON.stringify(JSON.parse(props.modelValue), null, 2);
    emit("update:modelValue", formatted);
    jsonError.value = "";
  } catch {}
}

function adjustHeight() {
  nextTick(() => {
    if (!textarea.value) return;
    textarea.value.style.height = "auto";
    const h = Math.max(160, textarea.value.scrollHeight);
    textareaHeight.value = `${h}px`;
    textarea.value.style.height = textareaHeight.value;
  });
}

function syncScroll() {
  if (textarea.value && lineNumbers.value) {
    lineNumbers.value.scrollTop = textarea.value.scrollTop;
  }
}

function insertTab(e: KeyboardEvent) {
  const el = e.target as HTMLTextAreaElement;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const newVal = el.value.substring(0, start) + "  " + el.value.substring(end);
  emit("update:modelValue", newVal);
  nextTick(() => {
    el.selectionStart = el.selectionEnd = start + 2;
  });
}

watch(() => props.modelValue, (val) => validateJson(val), { immediate: true });
</script>
