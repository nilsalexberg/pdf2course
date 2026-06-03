<script setup lang="ts">
  import type { Exercise, Lesson, LessonStep } from '@@/types/course';

  definePageMeta({ middleware: ['auth', 'role'], layout: 'blank' });

  const route = useRoute();
  const courseId = route.params.id as string;
  const lessonId = route.params.lessonId as string;

  const {
    data: lesson,
    pending,
    error
  } = await useFetch<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}`);

  useHead(
    computed(() => ({
      title: lesson.value ? `${lesson.value.title} · pdf2course` : 'Lesson · pdf2course'
    }))
  );

  const { setBreadcrumbs } = useBreadcrumbs();
  watch(
    lesson as any,
    (l: Lesson | null) => {
      setBreadcrumbs([
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Course', to: `/dashboard/courses/${courseId}/learn` },
        { label: l?.title || 'Lesson' }
      ]);
    },
    { immediate: true }
  );

  watchEffect(() => {
    if (!pending.value && lesson.value && lesson.value.status !== 'ready') {
      navigateTo(`/dashboard/courses/${courseId}/learn`);
    }
  });

  // ─── Slide model ─────────────────────────────────────────────────────────────
  // Slides: 0 = intro, 1..N = steps, N+1 = summary
  type Slide =
    | { kind: 'intro' }
    | { kind: 'step'; step: LessonStep; stepIndex: number }
    | { kind: 'summary' };

  const slides = computed<Slide[]>(() => {
    if (!lesson.value?.content) return [];
    return [
      { kind: 'intro' },
      ...lesson.value.content.steps.map((step, i) => ({
        kind: 'step' as const,
        step,
        stepIndex: i
      })),
      { kind: 'summary' }
    ];
  });

  const currentIndex = ref(0);
  const currentSlide = computed(() => slides.value[currentIndex.value] as Slide | undefined);

  // ─── Exercise tracking ───────────────────────────────────────────────────────
  // Map stepIndex → { answered, correct }
  const exerciseResults = ref<Record<number, { correct: boolean }>>({});
  const completionSaved = ref(false);

  const totalExercises = computed(
    () => lesson.value?.content?.steps.filter((s) => s.type !== 'section').length ?? 0
  );
  const answeredCount = computed(() => Object.keys(exerciseResults.value).length);
  const correctCount = computed(
    () => Object.values(exerciseResults.value).filter((r) => r.correct).length
  );
  const scorePercent = computed(() =>
    answeredCount.value > 0 ? Math.round((correctCount.value / answeredCount.value) * 100) : 0
  );

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const isCurrentExercise = computed(() => {
    const s = currentSlide.value;
    return s?.kind === 'step' && s.step.type !== 'section';
  });

  const currentStepAnswered = computed(() => {
    const s = currentSlide.value;
    if (s?.kind !== 'step') return true;
    return s.stepIndex in exerciseResults.value;
  });

  const canContinue = computed(() => {
    if (!currentSlide.value) return false;
    if (!isCurrentExercise.value) return true;
    return currentStepAnswered.value;
  });

  const isLastSlide = computed(() => currentIndex.value === slides.value.length - 1);

  function goNext() {
    if (!isLastSlide.value) currentIndex.value++;
  }

  function onExerciseAnswered(isCorrect: boolean) {
    const s = currentSlide.value;
    if (s?.kind !== 'step') return;
    exerciseResults.value = { ...exerciseResults.value, [s.stepIndex]: { correct: isCorrect } };
  }

  // ─── Typed accessor for the current exercise ─────────────────────────────────
  const currentExercise = computed<Exercise | null>(() => {
    const s = currentSlide.value;
    if (s?.kind !== 'step' || s.step.type === 'section') return null;
    return s.step as Exercise;
  });

  // ─── Completion ──────────────────────────────────────────────────────────────
  watch(currentSlide, async (slide) => {
    if (
      slide?.kind === 'summary' &&
      (scorePercent.value >= 70 || totalExercises.value === 0) &&
      !completionSaved.value
    ) {
      completionSaved.value = true;
      try {
        await $fetch(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
          method: 'POST',
          body: { score_percent: scorePercent.value }
        });
      } catch (err) {
        console.warn('[lesson-complete] Failed to save completion:', err);
        completionSaved.value = false;
      }
    }
  });

  // ─── Progress ─────────────────────────────────────────────────────────────────
  const progressPercent = computed(() =>
    slides.value.length > 1 ? Math.round((currentIndex.value / (slides.value.length - 1)) * 100) : 0
  );
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
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

    <template v-else-if="lesson?.content">
      <!-- Header -->
      <div class="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div class="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <NuxtLink
            :to="`/dashboard/courses/${courseId}/learn`"
            class="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>

          <!-- Progress bar -->
          <div class="flex-1 space-y-1">
            <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-emerald-500 transition-all duration-500"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
            <p class="text-xs text-slate-500">{{ currentIndex }} / {{ slides.length - 1 }}</p>
          </div>

          <!-- Score badge -->
          <div
            v-if="answeredCount > 0"
            class="shrink-0 flex items-center gap-1 text-sm font-semibold"
            :class="scorePercent >= 70 ? 'text-emerald-400' : 'text-amber-400'"
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
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            {{ correctCount }}/{{ answeredCount }}
          </div>
        </div>
      </div>

      <!-- Slide content -->
      <div class="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-10">
        <!-- Intro slide -->
        <template v-if="currentSlide?.kind === 'intro'">
          <div class="flex-1 space-y-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Lesson {{ lesson.lesson_number }}
            </p>
            <h1 class="text-2xl font-bold text-slate-100">{{ lesson.title }}</h1>
            <p class="text-slate-300 leading-relaxed">{{ lesson.content.introduction }}</p>
          </div>
        </template>

        <!-- Step slide (section or exercise) -->
        <template v-else-if="currentSlide?.kind === 'step'">
          <!-- Section -->
          <template v-if="currentSlide.step.type === 'section'">
            <div class="flex-1 space-y-4">
              <h2 class="text-xl font-bold text-slate-100">{{ currentSlide.step.title }}</h2>
              <p class="text-slate-300 leading-relaxed">{{ currentSlide.step.content }}</p>
            </div>
          </template>

          <!-- Exercise -->
          <template v-else-if="currentExercise">
            <div class="flex-1">
              <CourseLessonExercise
                :key="currentSlide.stepIndex"
                :exercise="currentExercise"
                :index="currentSlide.stepIndex"
                @answered="onExerciseAnswered"
              />
            </div>
          </template>
        </template>

        <!-- Summary slide -->
        <template v-else-if="currentSlide?.kind === 'summary'">
          <div class="flex-1 space-y-6">
            <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
              <h2 class="text-base font-bold text-slate-100 flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Summary
              </h2>
              <p class="text-slate-300 leading-relaxed">{{ lesson.content.summary }}</p>
            </div>

            <!-- Score card -->
            <div
              v-if="totalExercises > 0"
              class="rounded-xl border p-6 text-center space-y-3"
              :class="
                scorePercent >= 70
                  ? 'border-emerald-700/50 bg-emerald-900/10'
                  : 'border-amber-700/50 bg-amber-900/10'
              "
            >
              <p
                class="text-3xl font-bold"
                :class="scorePercent >= 70 ? 'text-emerald-400' : 'text-amber-400'"
              >
                {{ scorePercent }}%
              </p>
              <p class="text-slate-300 text-sm">
                {{ correctCount }} correct out of {{ answeredCount }} exercises
              </p>
              <p v-if="scorePercent >= 70" class="text-emerald-400 text-sm font-medium">
                Great work! Lesson complete.
              </p>
              <p v-else class="text-amber-400 text-sm font-medium">
                Keep practicing — you can review by retaking the lesson.
              </p>
            </div>

            <NuxtLink
              :to="`/dashboard/courses/${courseId}/learn`"
              class="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors"
            >
              Finish Lesson
            </NuxtLink>
          </div>
        </template>

        <!-- Continue button -->
        <div v-if="!isLastSlide" class="pt-8">
          <button
            class="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
            :class="
              canContinue
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            "
            :disabled="!canContinue"
            @click="goNext"
          >
            {{ isCurrentExercise && !currentStepAnswered ? 'Answer to continue' : 'Continue' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
