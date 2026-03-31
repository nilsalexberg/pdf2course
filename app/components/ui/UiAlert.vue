<script setup lang="ts">
defineProps<{
  type?: 'success' | 'error' | 'warning' | 'info'
  message: string
}>()
</script>

<template>
  <div
    class="rounded-lg px-4 py-3 text-sm flex items-start gap-3"
    :class="{
      'bg-emerald-900/40 border border-emerald-700/50 text-emerald-300': type === 'success' || !type,
      'bg-red-900/40 border border-red-700/50 text-red-300': type === 'error',
      'bg-amber-900/40 border border-amber-700/50 text-amber-300': type === 'warning',
      'bg-blue-900/40 border border-blue-700/50 text-blue-300': type === 'info',
    }"
  >
    <svg v-if="type === 'success' || !type" class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    <svg v-else-if="type === 'error'" class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
    <svg v-else class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>{{ message }}</span>
  </div>
</template>
