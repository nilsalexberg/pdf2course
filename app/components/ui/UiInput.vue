<script setup lang="ts">
  defineProps<{
    id?: string;
    label?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    minlength?: string | number;
    min?: string | number;
    max?: string | number;
    help?: string;
  }>();

  const model = defineModel<string | number | null>();
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-slate-200 mb-1" :for="id || label">{{
      label
    }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type || 'text'"
      :required="required"
      :minlength="minlength"
      :min="min"
      :max="max"
      class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      :placeholder="placeholder"
    />
    <p v-if="help" class="mt-1 text-xs text-slate-500">{{ help }}</p>
  </div>
</template>
