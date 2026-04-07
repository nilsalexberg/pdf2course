<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  to?: string
  size?: 'sm' | 'xs'
  block?: boolean
}>(), {
  type: 'button',
  disabled: false,
  loading: false,
  variant: 'primary',
  to: undefined,
  size: 'sm',
  block: true,
})

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden shrink-0',
  props.size === 'sm' ? 'px-4 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-xs',
  props.block ? 'w-full' : '',
  props.variant === 'primary' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : '',
  props.variant === 'secondary' ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600 hover:text-white' : '',
  props.variant === 'danger' ? 'bg-red-600/90 text-white hover:bg-red-500' : '',
  props.variant === 'ghost' ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40' : ''
])
</script>

<template>
  <NuxtLink v-if="to && !disabled" :to="to" :class="buttonClasses">
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled || loading" :class="buttonClasses">
    <UiSpinner v-if="loading" class="w-4 h-4 mr-2" />
    <slot />
  </button>
</template>
