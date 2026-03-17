<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'] })

const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-slate-400">
        Edit course (placeholder). Course ID: {{ id }}
      </p>
      <NuxtLink to="/producer" class="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">
        Back to dashboard
      </NuxtLink>
    </div>
  </div>
</template>
