<script setup lang="ts">
  import { FetchError } from 'ofetch';
  import type { CourseWithSignedCover } from '@@/types/course';

  interface PublicCoursesResponse {
    courses: CourseWithSignedCover[];
    total: number;
  }

  const search = ref('');
  const courses = ref<CourseWithSignedCover[]>([]);
  const total = ref(0);
  const page = ref(1);
  const loading = ref(true);
  const loadingMore = ref(false);
  const error = ref<string | null>(null);

  const hasMore = computed(() => courses.value.length < total.value);

  const sentinel = ref<HTMLElement | null>(null);

  async function fetchCourses(reset = false) {
    if (reset) {
      page.value = 1;
      loading.value = true;
      error.value = null;
    } else {
      loadingMore.value = true;
    }

    try {
      const params: Record<string, string | number> = { page: reset ? 1 : page.value };
      if (search.value.trim()) params.q = search.value.trim();

      const res = await $fetch<PublicCoursesResponse>('/api/public/courses', { params });

      if (reset) {
        courses.value = res.courses;
      } else {
        courses.value.push(...res.courses);
      }
      total.value = res.total;
    } catch (err) {
      if (err instanceof FetchError) {
        error.value = err.data?.statusMessage || 'Failed to load courses';
      } else {
        error.value = 'Failed to load courses';
      }
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchCourses(true), 300);
  });

  onMounted(() => {
    fetchCourses(true);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
          page.value++;
          fetchCourses();
        }
      },
      { rootMargin: '200px' }
    );

    watch(
      sentinel,
      (el) => {
        if (el) observer.observe(el);
      },
      { immediate: true }
    );

    onUnmounted(() => observer.disconnect());
  });
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-white">
        Public courses
        <span v-if="!loading && total > 0" class="ml-2 text-sm font-normal text-slate-400"
          >({{ total }})</span
        >
      </h2>
    </div>

    <div class="mb-4">
      <UiInput v-model="search" placeholder="Search courses…" type="search" />
    </div>

    <p v-if="error" class="text-sm text-red-400 mb-4">
      {{ error }}
    </p>

    <div v-if="loading" class="flex justify-center py-12">
      <UiSpinner class="w-8 h-8 text-emerald-500" />
    </div>

    <div
      v-else-if="!courses.length"
      class="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center text-slate-400"
    >
      <p v-if="search">No courses found for "{{ search }}".</p>
      <p v-else>No public courses available yet.</p>
      <p v-if="!search" class="text-sm mt-2">
        Courses pending admin approval will appear here once approved.
      </p>
    </div>

    <ul v-else class="space-y-4">
      <CoursesCourseCard
        v-for="course in courses"
        :key="course.id"
        :course="course"
        cover-size="md"
        :title-to="`/dashboard/courses/${course.id}/learn`"
      >
        <template #actions>
          <UiButton :to="`/dashboard/courses/${course.id}/learn`" :block="false"> Learn </UiButton>
        </template>
      </CoursesCourseCard>
    </ul>

    <div v-if="loadingMore" class="flex justify-center py-6">
      <UiSpinner class="w-6 h-6 text-emerald-500" />
    </div>

    <div ref="sentinel" class="h-1" />
  </div>
</template>
