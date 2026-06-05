<script setup lang="ts">
  import type { Lesson, ModuleWithLessons } from '@@/types/course';

  const props = defineProps<{
    mod: ModuleWithLessons;
    modIndex: number;
    expandedLesson: string | null;
    completedLessonIds: Set<string>;
    lockedLessonIds: Set<string>;
  }>();

  defineEmits<{
    toggleLesson: [lessonId: string];
    'update:lesson': [lesson: Lesson];
  }>();

  const isModuleLocked = computed(() => {
    const first = props.mod.lessons[0];
    return first ? props.lockedLessonIds.has(first.id) : false;
  });

  function moduleColor(index: number) {
    const colors = [
      'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
      'from-violet-500/20 to-purple-500/20 border-violet-500/30',
      'from-amber-500/20 to-orange-500/20 border-amber-500/30',
      'from-sky-500/20 to-blue-500/20 border-sky-500/30',
      'from-rose-500/20 to-pink-500/20 border-rose-500/30'
    ];
    return colors[index % colors.length];
  }

  function moduleBadgeColor(index: number) {
    const colors = [
      'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
      'bg-violet-500/20 text-violet-300 ring-violet-500/30',
      'bg-amber-500/20 text-amber-300 ring-amber-500/30',
      'bg-sky-500/20 text-sky-300 ring-sky-500/30',
      'bg-rose-500/20 text-rose-300 ring-rose-500/30'
    ];
    return colors[index % colors.length];
  }
</script>

<template>
  <div class="rounded-2xl border bg-gradient-to-br overflow-hidden" :class="moduleColor(modIndex)">
    <div class="px-6 pt-5 pb-4">
      <div class="flex items-start gap-4">
        <span
          class="inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ring-1 shrink-0"
          :class="moduleBadgeColor(modIndex)"
        >
          {{ mod.moduleNumber }}
        </span>
        <div class="min-w-0 pt-0.5">
          <h2 class="text-lg font-semibold text-white leading-snug">
            {{ mod.title }}
          </h2>
          <p class="text-sm text-slate-400 mt-0.5 leading-relaxed">
            {{ mod.description }}
          </p>
        </div>
        <div class="shrink-0 flex items-center gap-2 pt-1 ml-auto">
          <svg
            v-if="isModuleLocked"
            class="w-5 h-5 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span class="text-xs text-slate-500">{{ mod.lessons.length }} lessons</span>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-800/60">
      <CourseLearnLesson
        v-for="(lesson, lessonIndex) in mod.lessons"
        :key="lesson.id"
        :lesson="lesson"
        :lesson-index="lessonIndex"
        :is-expanded="expandedLesson === lesson.id"
        :is-last="lessonIndex === mod.lessons.length - 1"
        :is-completed="completedLessonIds.has(lesson.id)"
        :is-locked="lockedLessonIds.has(lesson.id)"
        @toggle="$emit('toggleLesson', $event)"
        @update:lesson="$emit('update:lesson', $event)"
      />
    </div>
  </div>
</template>
