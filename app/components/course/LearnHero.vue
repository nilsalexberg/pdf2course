<script setup lang="ts">
import type { CourseWithSignedCover } from '@@/types/course'

defineProps<{
  course: CourseWithSignedCover
  modulesCount: number
  totalLessons: number
}>()
</script>

<template>
  <div class="relative overflow-hidden">
    <div
      v-if="course.cover_url_signed"
      class="absolute inset-0 scale-110"
      :style="`background-image: url('${course.cover_url_signed}'); background-size: cover; background-position: center;`"
    />
    <div class="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />

    <div class="relative max-w-4xl mx-auto px-4 py-10 pt-4">

      <div class="flex gap-6 items-start">
        <img
          v-if="course.cover_url_signed"
          :src="course.cover_url_signed"
          :alt="course.title"
          class="w-24 h-24 rounded-xl object-cover border border-slate-700/60 shadow-xl shrink-0 hidden sm:block"
        >
        <div class="min-w-0">
          <h1 class="text-3xl font-bold text-white leading-tight mb-2">
            {{ course.title }}
          </h1>
          <p v-if="course.description" class="text-slate-300 text-base leading-relaxed mb-4 max-w-2xl">
            {{ course.description }}
          </p>
          <div class="flex flex-wrap gap-3">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-xs text-slate-300">
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {{ modulesCount }} modules
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-xs text-slate-300">
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {{ totalLessons }} lessons
            </span>
            <span
              v-if="course.config.language"
              class="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-xs text-slate-300"
            >
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {{ course.config.language }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
