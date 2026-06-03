<script setup lang="ts">
  import type { CourseWithSignedCover } from '@@/types/course';

  definePageMeta({ middleware: ['auth', 'role'] });
  useHead({ title: 'Admin · pdf2course' });

  const { setBreadcrumbs } = useBreadcrumbs();
  setBreadcrumbs([{ label: 'Admin' }]);

  const {
    data: courses,
    pending,
    error,
    refresh
  } = await useFetch<CourseWithSignedCover[]>('/api/admin/courses', {
    default: () => []
  });

  const rejectingId = ref<string | null>(null);
  const actionError = ref<string | null>(null);

  const pendingReview = computed(
    () => courses.value?.filter((c) => c.status === 'pending_review') ?? []
  );
  const otherCourses = computed(
    () => courses.value?.filter((c) => c.status !== 'pending_review') ?? []
  );

  async function approve(id: string) {
    actionError.value = null;
    try {
      await $fetch(`/api/admin/courses/${id}/approve`, { method: 'POST' });
      await refresh();
    } catch (err: any) {
      actionError.value = err.data?.statusMessage || 'Failed to approve course';
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
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-semibold text-white">Admin — Courses</h1>
      </div>

      <p v-if="error" class="text-sm text-red-400 mb-4">
        {{ error.message }}
      </p>
      <p v-if="actionError" class="text-sm text-red-400 mb-4">
        {{ actionError }}
      </p>

      <div v-if="pending" class="flex justify-center py-16">
        <UiSpinner class="w-8 h-8 text-emerald-500" />
      </div>

      <template v-else>
        <!-- Pending Review -->
        <section class="mb-10">
          <h2 class="text-lg font-semibold text-amber-300 mb-4">
            Pending review
            <span class="ml-2 text-sm font-normal text-slate-400"
              >({{ pendingReview.length }})</span
            >
          </h2>

          <div
            v-if="!pendingReview.length"
            class="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400 text-sm"
          >
            No courses awaiting review.
          </div>

          <ul v-else class="space-y-3">
            <CoursesCourseCard
              v-for="course in pendingReview"
              :key="course.id"
              :course="course"
              :highlighted="true"
              cover-size="md"
              :title-to="`/admin/courses/${course.id}`"
            >
              <template #meta>
                <p class="text-xs text-slate-500">
                  {{ new Date(course.created_at).toLocaleDateString() }}
                </p>
              </template>
              <template #actions>
                <button
                  class="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  @click="approve(course.id)"
                >
                  Approve
                </button>
                <button
                  class="text-sm text-red-400 hover:text-red-300 transition-colors"
                  @click="rejectingId = course.id"
                >
                  Reject
                </button>
              </template>
            </CoursesCourseCard>
          </ul>
        </section>

        <!-- All other courses -->
        <section>
          <h2 class="text-lg font-semibold text-slate-300 mb-4">
            All courses
            <span class="ml-2 text-sm font-normal text-slate-400">({{ otherCourses.length }})</span>
          </h2>

          <div
            v-if="!otherCourses.length"
            class="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400 text-sm"
          >
            No other courses.
          </div>

          <ul v-else class="space-y-3">
            <CoursesCourseCard
              v-for="course in otherCourses"
              :key="course.id"
              :course="course"
              cover-size="sm"
              :title-to="`/admin/courses/${course.id}`"
            >
              <template #meta>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize"
                    :class="statusClass[course.status]"
                  >
                    {{ course.status.replace('_', ' ') }}
                  </span>
                  <span class="text-xs text-slate-500">
                    {{ new Date(course.created_at).toLocaleDateString() }}
                  </span>
                </div>
              </template>
              <template v-if="course.status === 'approved'" #actions>
                <button
                  class="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  @click="rejectingId = course.id"
                >
                  Revoke
                </button>
              </template>
            </CoursesCourseCard>
          </ul>
        </section>
      </template>
    </div>

    <!-- Reject modal -->
    <AdminRejectModal :course-id="rejectingId" @close="rejectingId = null" @rejected="refresh" />
  </div>
</template>
