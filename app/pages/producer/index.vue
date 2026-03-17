<script setup lang="ts">
import type { CourseWithSignedCover } from '~/types/course'

definePageMeta({ middleware: ['auth', 'role'] })
useProfile()

const { data: courses, pending, error } = await useFetch<CourseWithSignedCover[]>('/api/courses', {
  default: () => [],
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-semibold text-white">
          My courses
        </h1>
        <NuxtLink
          to="/producer/courses/new"
          class="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          New course
        </NuxtLink>
      </div>

      <p v-if="error" class="text-sm text-red-400 mb-4">
        {{ error.message }}
      </p>

      <div v-if="pending" class="text-sm text-slate-400">
        Loading…
      </div>

      <div v-else-if="!courses?.length" class="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">
        <p class="mb-4">
          You don’t have any courses yet.
        </p>
        <NuxtLink
          to="/producer/courses/new"
          class="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          Create your first course
        </NuxtLink>
      </div>

      <ul v-else class="space-y-4">
        <li
          v-for="course in courses"
          :key="course.id"
          class="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden flex gap-4"
        >
          <div
            v-if="course.cover_url_signed"
            class="w-32 shrink-0 bg-slate-800"
          >
            <img
              :src="course.cover_url_signed"
              :alt="course.title"
              class="w-full h-24 object-cover"
            >
          </div>
          <div class="flex-1 min-w-0 py-4 pr-4">
            <h2 class="font-semibold text-white truncate">
              {{ course.title }}
            </h2>
            <p v-if="course.description" class="text-sm text-slate-400 line-clamp-2 mt-0.5">
              {{ course.description }}
            </p>
            <p class="text-xs text-slate-500 mt-2">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 capitalize"
                :class="{
                  'bg-slate-700 text-slate-300': course.status === 'draft',
                  'bg-amber-900/50 text-amber-200': course.status === 'pending_review',
                  'bg-emerald-900/50 text-emerald-200': course.status === 'approved',
                  'bg-red-900/50 text-red-200': course.status === 'rejected',
                }"
              >
                {{ course.status.replace('_', ' ') }}
              </span>
            </p>
          </div>
          <div class="shrink-0 flex items-center pr-4">
            <NuxtLink
              :to="`/producer/courses/${course.id}/edit`"
              class="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Edit
            </NuxtLink>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
