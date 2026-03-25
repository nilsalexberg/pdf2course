<script setup lang="ts">
import type { Lesson } from '@@/types/course'

defineProps<{
  lesson: Lesson
  lessonIndex: number
  isExpanded: boolean
  isLast: boolean
}>()

defineEmits<{
  toggle: [lessonId: string]
}>()
</script>

<template>
  <div :class="!isLast ? 'border-b border-slate-800/40' : ''">
    <button
      class="w-full text-left px-6 py-4 hover:bg-slate-800/30 transition-colors group"
      @click="$emit('toggle', lesson.id)"
    >
      <div class="flex items-center gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium group-hover:border-slate-600 transition-colors">
          {{ lesson.lesson_number }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-100 group-hover:text-white transition-colors truncate">
            {{ lesson.title }}
          </p>
          <p v-if="!isExpanded" class="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {{ lesson.description }}
          </p>
        </div>
        <svg
          class="w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200"
          :class="isExpanded ? 'rotate-180' : ''"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <div
      v-if="isExpanded"
      class="px-6 pb-5 space-y-4 border-t border-slate-800/30 bg-slate-900/30"
    >
      <p class="text-sm text-slate-300 pt-4 leading-relaxed">
        {{ lesson.description }}
      </p>

      <div v-if="lesson.learning_objectives.length" class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Learning Objectives
        </p>
        <ul class="space-y-1.5">
          <li
            v-for="(obj, i) in lesson.learning_objectives"
            :key="i"
            class="flex items-start gap-2 text-sm text-slate-300"
          >
            <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
            </svg>
            {{ obj }}
          </li>
        </ul>
      </div>

      <div v-if="lesson.key_topics.length" class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Key Topics
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(topic, i) in lesson.key_topics"
            :key="i"
            class="inline-block rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-300"
          >
            {{ topic }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
