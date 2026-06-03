<script setup lang="ts">
  import type { CourseWithSignedCover } from '@@/types/course';

  definePageMeta({ middleware: ['auth', 'role'] });

  const route = useRoute();
  const id = route.params.id as string;

  const {
    data: course,
    pending,
    error,
    refresh
  } = await useFetch<CourseWithSignedCover>(`/api/courses/${id}`);

  useHead(
    computed(() => ({
      title: course.value ? `${course.value.title} · pdf2course` : 'Edit Course · pdf2course'
    }))
  );

  const { setBreadcrumbs } = useBreadcrumbs();
  watch(
    course,
    (c) => {
      setBreadcrumbs([{ label: 'Dashboard', to: '/dashboard' }, { label: c?.title || 'Course' }]);
    },
    { immediate: true }
  );

  const {
    title,
    description,
    numModules,
    lessonsPerModule,
    languageLevel,
    focus,
    language,
    tone,
    chunkSize,
    chunkOverlap,
    loading,
    errorMessage,
    onCoverChange,
    fillForm,
    buildFormData
  } = useCourseForm();

  // ─── SSE: auto-update status during generation ────────────────────────────────
  watch(
    () => course.value?.id,
    (courseId, _prev, onCleanup) => {
      if (!courseId) return;
      if (!import.meta.client) return;

      const es = new EventSource(`/api/courses/${courseId}/generation-status`);

      es.onmessage = (e) => {
        if (!course.value) return;
        const { status, error: genError } = JSON.parse(e.data);
        course.value = {
          ...course.value,
          generation_status: status,
          generation_error: genError ?? null
        };
      };

      es.onerror = () => console.error('[course-sse] Connection error');

      onCleanup(() => es.close());
    },
    { immediate: true }
  );

  // Initialize form with course data
  watch(
    course,
    (newCourse) => {
      if (newCourse) fillForm(newCourse);
    },
    { immediate: true }
  );

  const stagedPdfs = ref<File[]>([]);
  const activeTab = ref('edit');

  const tabs = [
    { key: 'edit', label: 'Details' },
    { key: 'generation', label: 'Generation' },
    { key: 'publish', label: 'Publication' }
  ];

  async function handleSubmit() {
    errorMessage.value = null;
    if (!title.value.trim()) {
      errorMessage.value = 'Title is required.';
      return;
    }

    loading.value = true;
    try {
      const formData = buildFormData((fd) => {
        for (const pdf of stagedPdfs.value) fd.append('pdfs', pdf);
      });
      await $fetch(`/api/courses/${id}`, { method: 'PUT', body: formData } as any);
      await refresh();
    } catch (err: any) {
      errorMessage.value =
        err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to update course.';
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div v-if="pending" class="flex justify-center py-12">
        <UiSpinner class="w-8 h-8 text-emerald-500" />
      </div>

      <div
        v-else-if="error"
        class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-red-400"
      >
        <p>{{ error.message || 'Failed to load course details.' }}</p>
      </div>

      <div v-else class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-semibold text-white mb-6">Edit course</h1>

        <UiTabs v-model="activeTab" :tabs="tabs">
          <!-- ─── Details tab ───────────────────────────────────────────────── -->
          <template #edit>
            <form class="space-y-4" @submit.prevent="handleSubmit">
              <CoursesFormFields
                v-model:title="title"
                v-model:description="description"
                :cover-url-signed="course?.cover_url_signed"
                @cover-change="onCoverChange"
              />

              <div class="pt-6 border-t border-slate-800/50">
                <CoursesSourcePdfs :course-id="id" @update:staged-pdfs="stagedPdfs = $event" />
              </div>

              <UiButton type="submit" :loading="loading">
                {{ loading ? 'Saving…' : 'Save changes' }}
              </UiButton>
            </form>

            <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
              {{ errorMessage }}
            </p>
          </template>

          <!-- ─── Generation tab ───────────────────────────────────────────── -->
          <template #generation>
            <form class="space-y-4" @submit.prevent="handleSubmit">
              <CoursesSettingsFields
                v-model:num-modules="numModules"
                v-model:lessons-per-module="lessonsPerModule"
                v-model:language-level="languageLevel"
                v-model:focus="focus"
                v-model:language="language"
                v-model:tone="tone"
                v-model:chunk-size="chunkSize"
                v-model:chunk-overlap="chunkOverlap"
              />

              <UiButton type="submit" :loading="loading">
                {{ loading ? 'Saving…' : 'Save changes' }}
              </UiButton>
            </form>

            <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
              {{ errorMessage }}
            </p>
          </template>

          <!-- ─── Publish tab ──────────────────────────────────────────────── -->
          <template #publish>
            <CoursesPublishTab :course="course" :course-id="id" @update:course="course = $event" />
          </template>
        </UiTabs>
      </div>
    </div>
  </div>
</template>
