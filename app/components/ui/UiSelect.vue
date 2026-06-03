<script setup lang="ts">
  interface Option {
    value: string | number;
    label: string;
  }

  defineProps<{
    id?: string;
    label?: string;
    options: (Option | string)[] | readonly (Option | string)[];
    required?: boolean;
    help?: string;
  }>();

  const model = defineModel<string | number | null>();
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-slate-200 mb-1" :for="id || label">{{
      label
    }}</label>
    <select
      :id="id"
      v-model="model"
      :required="required"
      class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]"
      style="
        background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2394a3b8%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22 /%3E%3C/svg%3E');
      "
    >
      <option
        v-for="option in options"
        :key="typeof option === 'string' ? option : option.value"
        :value="typeof option === 'string' ? option : option.value"
      >
        {{ typeof option === 'string' ? option : option.label }}
      </option>
    </select>
    <p v-if="help" class="mt-1 text-xs text-slate-500">{{ help }}</p>
  </div>
</template>
