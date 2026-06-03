<script setup lang="ts">
  import type { CourseStructure } from '@@/types/course';

  definePageMeta({ middleware: ['auth', 'role'] });

  const route = useRoute();
  const id = route.params.id as string;

  useHead({ title: 'Edit Course Structure · pdf2course' });

  const { data, pending, error, refresh } = await useFetch<CourseStructure>(
    `/api/courses/${id}/structure`
  );
  const modules = computed(() => data.value?.modules ?? []);
  const courseTitle = computed(() => data.value?.course_title ?? '');

  const { setBreadcrumbs } = useBreadcrumbs();
  watch(
    courseTitle,
    (title) => {
      setBreadcrumbs([
        { label: 'Dashboard', to: '/dashboard' },
        { label: title || 'Course', to: `/dashboard/courses/${id}/edit` },
        { label: 'Structure' }
      ]);
    },
    { immediate: true }
  );
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-semibold text-white mb-2">
          {{ courseTitle || 'Edit Course Structure' }}
        </h1>
        <p class="text-slate-400 text-sm mb-8">Manage modules and lessons for this course.</p>

        <div v-if="pending" class="flex justify-center py-12">
          <UiSpinner class="w-8 h-8 text-emerald-500" />
        </div>

        <div v-else-if="error" class="text-center text-red-400 py-8">
          <p>{{ error.message || 'Failed to load course structure.' }}</p>
          <UiButton class="mt-4" :block="false" @click="refresh"> Retry </UiButton>
        </div>

        <div
          v-else-if="!modules.length"
          class="flex flex-col items-center justify-center py-16 text-slate-600 border border-dashed border-slate-700 rounded-xl"
        >
          <p class="text-lg font-medium">No structure yet</p>
          <p class="text-sm mt-1">
            Generate the course structure first from the course settings page.
          </p>
        </div>

        <CoursesStructureList v-else :modules="modules" :course-id="id" />
      </div>
    </div>
  </div>
</template>
