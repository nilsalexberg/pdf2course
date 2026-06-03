<script setup lang="ts">
  import type { CourseWithSignedCover, Lesson, ModuleWithLessons } from '@@/types/course';

  definePageMeta({ middleware: ['auth', 'role'] });

  const route = useRoute();
  const id = route.params.id as string;

  interface LearnStructure {
    course: CourseWithSignedCover;
    modules: ModuleWithLessons[];
    completedLessonIds: string[];
  }

  const { data, pending, error } = await useFetch<LearnStructure>(`/api/courses/${id}/learn`);

  useHead(
    computed(() => ({
      title: data.value ? `${data.value.course.title} · pdf2course` : 'Learn · pdf2course'
    }))
  );

  const { setBreadcrumbs } = useBreadcrumbs();
  watch(
    data as any,
    (d: LearnStructure | null) => {
      setBreadcrumbs([
        { label: 'Dashboard', to: '/dashboard' },
        { label: d?.course.title || 'Course' }
      ]);
    },
    { immediate: true }
  );

  const totalLessons = computed(
    () => data.value?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0
  );

  const completedSet = computed(() => new Set(data.value?.completedLessonIds ?? []));
  const completedCount = computed(() => completedSet.value.size);
  const progressPercent = computed(() =>
    totalLessons.value > 0 ? Math.round((completedCount.value / totalLessons.value) * 100) : 0
  );

  const lockedLessonIds = computed<Set<string>>(() => {
    const locked = new Set<string>();
    if (!data.value) return locked;
    let previousModuleComplete = true;
    for (const mod of data.value.modules) {
      if (!previousModuleComplete) {
        for (const lesson of mod.lessons) locked.add(lesson.id);
        continue;
      }
      let prevDone = true;
      for (const lesson of mod.lessons) {
        if (!prevDone) locked.add(lesson.id);
        prevDone = completedSet.value.has(lesson.id);
      }
      previousModuleComplete = mod.lessons.every((l) => completedSet.value.has(l.id));
    }
    return locked;
  });

  const expandedLesson = ref<string | null>(null);

  function toggleLesson(lessonId: string) {
    expandedLesson.value = expandedLesson.value === lessonId ? null : lessonId;
  }

  function updateLesson(lesson: Lesson) {
    if (!data.value) return;
    data.value = {
      ...data.value,
      modules: data.value.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((l) => (l.id === lesson.id ? lesson : l))
      }))
    };
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
      </div>
    </div>

    <template v-else-if="data">
      <CourseLearnHero
        :course="data.course"
        :modules-count="data.modules.length"
        :total-lessons="totalLessons"
      />

      <!-- Course progress bar -->
      <div class="max-w-4xl mx-auto px-4 pt-6">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-400">Course progress</span>
            <span
              class="font-semibold"
              :class="progressPercent === 100 ? 'text-emerald-400' : 'text-slate-300'"
            >
              {{ completedCount }} / {{ totalLessons }} lessons
            </span>
          </div>
          <div class="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="progressPercent === 100 ? 'bg-emerald-500' : 'bg-emerald-600'"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
          <p
            v-if="progressPercent === 100"
            class="text-emerald-400 text-sm font-medium flex items-center gap-2"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Course complete!
          </p>
        </div>
      </div>

      <div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <CourseLearnModule
          v-for="(mod, modIndex) in data.modules"
          :key="mod.id"
          :mod="mod"
          :mod-index="modIndex"
          :expanded-lesson="expandedLesson"
          :completed-lesson-ids="completedSet"
          :locked-lesson-ids="lockedLessonIds"
          @toggle-lesson="toggleLesson"
          @update:lesson="updateLesson"
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
