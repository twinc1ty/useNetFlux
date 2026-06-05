<template>
  <button
    class="px-4 py-2.5 text-sm transition-colors relative flex items-center gap-1.5 flex-shrink-0"
    :class="active
      ? 'text-teal-400 after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-teal-400'
      : 'text-slate-500 hover:text-slate-300'"
  >
    <slot />
    <span
      v-if="count && count > 0"
      class="text-xs px-1.5 py-0.5 rounded-full leading-none"
      :class="active ? 'bg-teal-400/20 text-teal-400' : 'bg-slate-700 text-slate-400'"
    >
      {{ count }}
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean;
  count?: number;
}>();
</script>
