<script setup lang="ts">
  import type { CourseWithSignedCover } from '@@/types/course';

  definePageMeta({ middleware: ['auth', 'role'] });
  useHead({ title: 'Dashboard · pdf2course' });

  const { setBreadcrumbs } = useBreadcrumbs();
  setBreadcrumbs([{ label: 'Dashboard' }]);

  const {
    data: courses,
    pending,
    error,
    refresh
  } = await useFetch<CourseWithSignedCover[]>('/api/courses', {
    default: () => []
  });

  async function deleteCourse(id: string) {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await $fetch(`/api/courses/${id}`, { method: 'DELETE' } as any);
      await refresh();
    } catch (err: any) {
      alert(err.data?.statusMessage || 'Failed to delete course');
    }
  }

  const statusClass: Record<string, string> = {
    draft: 'bg-slate-700 text-slate-300',
    pending_review: 'bg-amber-900/50 text-amber-200',
    approved: 'bg-emerald-900/50 text-emerald-200',
    rejected: 'bg-red-900/50 text-red-200'
  };
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-12">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-2xl font-semibold text-white">My courses</h1>
          <UiButton to="/dashboard/courses/new" :block="false"> New course </UiButton>
        </div>

        <p v-if="error" class="text-sm text-red-400 mb-4">
          {{ error.message }}
        </p>

        <div v-if="pending" class="flex justify-center py-12">
          <UiSpinner class="w-8 h-8 text-emerald-500" />
        </div>

        <div
          v-else-if="!courses?.length"
          class="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400"
        >
          <p class="mb-4">You don't have any courses yet.</p>
          <UiButton to="/dashboard/courses/new" :block="false"> Create your first course </UiButton>
        </div>

        <ul v-else class="space-y-4">
          <CoursesCourseCard
            v-for="course in courses"
            :key="course.id"
            :course="course"
            cover-size="lg"
          >
            <template #meta>
              <div class="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <CoursesGenerationStatus :status="course?.generationStatus ?? 'idle'" />
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 capitalize"
                  :class="statusClass[course.status]"
                >
                  {{ course.status.replace('_', ' ') }}
                </span>
              </div>
            </template>
            <template #actions>
              <NuxtLink
                v-if="course.generationStatus === 'ready'"
                :to="`/dashboard/courses/${course.id}/learn`"
                class="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Learn
              </NuxtLink>
              <NuxtLink
                :to="`/dashboard/courses/${course.id}/edit`"
                class="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Edit
              </NuxtLink>
              <button
                class="text-sm text-red-400 hover:text-red-300 transition-colors"
                @click="deleteCourse(course.id)"
              >
                Delete
              </button>
            </template>
          </CoursesCourseCard>
        </ul>
      </div>

      <div class="mb-8">
        <CoursesPublicCourseList />
      </div>
    </div>
  </div>
</template>
