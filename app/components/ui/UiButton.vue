<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  to?: string
  block?: boolean
}>(), {
  type: 'button',
  disabled: false,
  loading: false,
  variant: 'primary',
  to: undefined,
  block: true,
})

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
  props.block ? 'w-full' : '',
  props.variant === 'primary' ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : '',
  props.variant === 'secondary' ? 'border border-slate-700 text-slate-100 hover:bg-slate-800/80' : '',
  props.variant === 'danger' ? 'bg-red-600/90 text-white hover:bg-red-500' : '',
  props.variant === 'ghost' ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40' : ''
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="buttonClasses">
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled || loading" :class="buttonClasses">
    <UiSpinner v-if="loading" class="w-4 h-4 mr-2" />
    <slot />
  </button>
</template>
