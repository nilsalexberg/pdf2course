<script setup lang="ts">
defineProps<{
  id?: string
  label?: string
  placeholder?: string
  rows?: number | string
  required?: boolean
}>()

const model = defineModel<string>()
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-slate-200 mb-1" :for="id || label">{{ label }}</label>
    <textarea
      :id="id"
      v-model="model"
      :rows="rows || 3"
      :required="required"
      class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
      :placeholder="placeholder"
    />
  </div>
</template>
