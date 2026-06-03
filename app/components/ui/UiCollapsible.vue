<script setup lang="ts">
  defineProps<{ label: string }>();

  const open = ref(false);
</script>

<template>
  <div>
    <button
      type="button"
      class="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      @click="open = !open"
    >
      <svg
        class="w-4 h-4 transition-transform"
        :class="{ 'rotate-90': open }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      {{ label }}
    </button>

    <div v-if="open" class="mt-4">
      <slot />
    </div>
  </div>
</template>
