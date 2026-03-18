<script setup lang="ts">
defineProps<{
  id?: string
  label?: string
  accept?: string
  help?: string
}>()

defineEmits<{
  (e: 'change', event: Event): void
}>()
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-slate-200 mb-1" :for="id || label">{{ label }}</label>
    <input
      :id="id"
      type="file"
      :accept="accept"
      class="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 file:font-medium file:cursor-pointer hover:file:bg-slate-600"
      @change="$emit('change', $event)"
    >
    <p v-if="help" class="mt-1 text-xs text-slate-500">{{ help }}</p>
  </div>
</template>
