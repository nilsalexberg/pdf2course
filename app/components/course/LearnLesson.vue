<script setup lang="ts">
import type { Lesson } from '@@/types/course'

const props = defineProps<{
  lesson: Lesson
  lessonIndex: number
  isExpanded: boolean
  isLast: boolean
}>()

const emit = defineEmits<{
  toggle: [lessonId: string]
  'update:lesson': [lesson: Lesson]
}>()

const router = useRouter()

const isGenerating = ref(false)
const isInProgress = computed(() => isGenerating.value || props.lesson.status === 'generating')

async function generateContent() {
  if (isInProgress.value) return
  isGenerating.value = true

  try {
    const updated = await $fetch<Lesson>(
      `/api/courses/${props.lesson.course_id}/lessons/${props.lesson.id}/generate`,
      { method: 'POST' },
    )
    emit('update:lesson', updated)
  }
  catch (err: any) {
    emit('update:lesson', {
      ...props.lesson,
      status: 'failed',
      generation_error: err?.data?.statusMessage ?? err?.message ?? 'Unknown error',
    })
  }
  finally {
    isGenerating.value = false
  }
}

function studyLesson() {
  router.push(`/dashboard/courses/${props.lesson.course_id}/lessons/${props.lesson.id}`)
}
</script>

<template>
  <div :class="!isLast ? 'border-b border-slate-800/40' : ''">
    <button
      class="w-full text-left px-6 py-4 hover:bg-slate-800/30 transition-colors group"
      @click="$emit('toggle', lesson.id)"
    >
      <div class="flex items-center gap-3">
        <!-- Status indicator -->
        <span
          class="shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium transition-colors"
          :class="{
            'bg-slate-800 border-slate-700 text-slate-400 group-hover:border-slate-600': lesson.status === 'not_generated' || lesson.status === 'failed',
            'bg-amber-900/40 border-amber-700/60 text-amber-400': isInProgress,
            'bg-emerald-900/40 border-emerald-700/60 text-emerald-400': lesson.status === 'ready',
          }"
        >
          <svg v-if="lesson.status === 'ready'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
          </svg>
          <svg v-else-if="isInProgress" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span v-else>{{ lesson.lesson_number }}</span>
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

      <!-- Generation error -->
      <p v-if="lesson.status === 'failed' && lesson.generation_error" class="text-xs text-red-400">
        Error: {{ lesson.generation_error }}
      </p>

      <!-- Action buttons -->
      <div class="pt-1">
        <button
          v-if="lesson.status === 'ready'"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
          @click="studyLesson"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Study Lesson
        </button>

        <button
          v-else-if="isInProgress"
          disabled
          class="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
        >
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating content…
        </button>

        <button
          v-else
          class="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          @click="generateContent"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ lesson.status === 'failed' ? 'Retry Generation' : 'Generate Content' }}
        </button>
      </div>
    </div>
  </div>
</template>
