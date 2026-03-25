<script setup lang="ts">
import type { CourseWithSignedCover, ModuleWithLessons } from '@@/types/course'

definePageMeta({ middleware: ['auth', 'role'] })

const route = useRoute()
const id = route.params.id as string

interface LearnStructure {
  course: CourseWithSignedCover
  modules: ModuleWithLessons[]
}

const { data, pending, error } = await useFetch<LearnStructure>(`/api/courses/${id}/learn`)

const totalLessons = computed(
  () => data.value?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0,
)

const expandedLesson = ref<string | null>(null)

function toggleLesson(lessonId: string) {
  expandedLesson.value = expandedLesson.value === lessonId ? null : lessonId
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center min-h-screen">
      <UiSpinner class="w-10 h-10 text-emerald-500" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center space-y-4">
        <p class="text-red-400">{{ error.message }}</p>
        <NuxtLink to="/dashboard" class="text-sm text-emerald-400 hover:text-emerald-300">
          ← Back to dashboard
        </NuxtLink>
      </div>
    </div>

    <template v-else-if="data">
      <CourseLearnHero
        :course="data.course"
        :modules-count="data.modules.length"
        :total-lessons="totalLessons"
      />

      <div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <CourseLearnModule
          v-for="(mod, modIndex) in data.modules"
          :key="mod.id"
          :mod="mod"
          :mod-index="modIndex"
          :expanded-lesson="expandedLesson"
          @toggle-lesson="toggleLesson"
        />

        <div
          v-if="!data.modules.length"
          class="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center text-slate-400"
        >
          <p>No modules found for this course.</p>
        </div>
      </div>
    </template>
  </div>
</template>
