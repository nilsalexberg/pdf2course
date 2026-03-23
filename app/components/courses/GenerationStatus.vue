<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationStatus } from '@@/types/course'

const props = defineProps<{
  status: GenerationStatus
}>()

const statusConfig = computed(() => {
  switch (props.status) {
    case 'idle':
      return {
        label: 'Idle',
        dotClass: 'bg-slate-500',
        bgClass: 'bg-slate-500/10 text-slate-400 border-slate-700/50',
        pulse: false
      }
    case 'processing':
    case 'generating_structure':
      return {
        label: props.status === 'processing' ? 'Processing PDF...' : 'Generating Structure...',
        dotClass: 'bg-yellow-400',
        bgClass: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
        pulse: true
      }
    case 'ready':
      return {
        label: 'Ready',
        dotClass: 'bg-emerald-400',
        bgClass: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
        pulse: false
      }
    case 'failed':
      return {
        label: 'Failed',
        dotClass: 'bg-red-400',
        bgClass: 'bg-red-400/10 text-red-400 border-red-400/20',
        pulse: false
      }
    default:
      return {
        label: String(props.status ?? 'Idle'),
        dotClass: 'bg-slate-500',
        bgClass: 'bg-slate-500/10 text-slate-400 border-slate-700/50',
        pulse: false
      }
  }
})
</script>

<template>
  <div 
    class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border"
    :class="statusConfig.bgClass"
  >
    <span class="relative flex h-2 w-2">
      <span 
        v-if="statusConfig.pulse"
        class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        :class="statusConfig.dotClass"
      ></span>
      <span 
        class="relative inline-flex rounded-full h-2 w-2"
        :class="statusConfig.dotClass"
      ></span>
    </span>
    {{ statusConfig.label }}
  </div>
</template>
