<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'] })

const route = useRoute()
const id = route.params.id as string

useHead({ title: 'Edit Course Structure · pdf2course' })
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-6">
        <NuxtLink :to="`/dashboard/courses/${id}/edit`" class="text-sm text-slate-400 hover:text-slate-300">
          ← Back to course settings
        </NuxtLink>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-semibold text-white mb-2">
          Edit Course Structure
        </h1>
        <p class="text-slate-400 text-sm mb-8">
          Manage modules and lessons for this course.
        </p>

        <!-- Placeholder -->
        <div class="flex flex-col items-center justify-center py-16 text-slate-600 border border-dashed border-slate-700 rounded-xl">
          <p class="text-lg font-medium">Coming soon</p>
          <p class="text-sm mt-1">Course structure editing is not yet implemented.</p>
        </div>
      </div>
    </div>
  </div>
</template>
