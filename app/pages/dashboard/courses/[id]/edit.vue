<script setup lang="ts">
import type { CourseWithSignedCover, Course } from '@@/types/course'
import { GENERATION_IN_PROGRESS } from '@@/types/course'

definePageMeta({ middleware: ['auth', 'role'] })

const route = useRoute()
const id = route.params.id as string

const { data: course, pending, error, refresh } = await useFetch<CourseWithSignedCover>(`/api/courses/${id}`)

useHead(computed(() => ({ title: course.value ? `${course.value.title} · pdf2course` : 'Edit Course · pdf2course' })))

const { setBreadcrumbs } = useBreadcrumbs()
watch(course as any, (c: CourseWithSignedCover | null) => {
  setBreadcrumbs([
    { label: 'Dashboard', to: '/dashboard' },
    { label: c?.title || 'Course', to: `/dashboard/courses/${id}/learn` },
    { label: 'Edit' }
  ])
}, { immediate: true })

const { title, description, numModules, lessonsPerModule, languageLevel, focus, language, tone, loading, errorMessage, onCoverChange, fillForm, buildFormData } = useCourseForm()

// ─── SSE: auto-update status during generation ────────────────────────────────
watch(
  () => course.value?.id,
  (courseId, _prev, onCleanup) => {
    if (!courseId) return
    if (!import.meta.client) return

    const es = new EventSource(`/api/courses/${courseId}/generation-status`)

    es.onmessage = (e) => {
      if (!course.value) return
      const { status, error: genError } = JSON.parse(e.data)
      course.value = { ...course.value, generation_status: status, generation_error: genError ?? null }
    }

    es.onerror = () => console.error('[course-sse] Connection error')

    onCleanup(() => es.close())
  },
  { immediate: true },
)

// Initialize form with course data
watch(course as any, (newCourse: CourseWithSignedCover | null) => {
  if (newCourse) fillForm(newCourse)
}, { immediate: true })

const stagedPdfs = ref<File[]>([])
const generating = ref(false)
const showRegenConfirm = ref(false)

const isReady = computed(() => course.value?.generation_status === 'ready')

function requestGenerate() {
  if (isReady.value) {
    showRegenConfirm.value = true
  } else {
    handleGenerate()
  }
}

async function handleGenerate() {
  showRegenConfirm.value = false
  errorMessage.value = null
  generating.value = true
  try {
    const updated = await $fetch<Course>(`/api/courses/${id}/generate`, { method: 'POST' })
    if (course.value) course.value = { ...course.value, ...updated }
  } catch (err: any) {
    errorMessage.value = err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to start generation.'
  } finally {
    generating.value = false
  }
}

async function handleSubmit() {
  errorMessage.value = null
  if (!title.value.trim()) {
    errorMessage.value = 'Title is required.'
    return
  }

  loading.value = true
  try {
    const formData = buildFormData((fd) => {
      for (const pdf of stagedPdfs.value) fd.append('pdfs', pdf)
    })
    await $fetch(`/api/courses/${id}`, { method: 'PUT', body: formData } as any)
    await refresh()
  } catch (err: any) {
    errorMessage.value = err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to update course.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-8">

      <div v-if="pending" class="flex justify-center py-12">
        <UiSpinner class="w-8 h-8 text-emerald-500" />
      </div>

      <div v-else-if="error" class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-red-400">
        <p>{{ error.message || 'Failed to load course details.' }}</p>
      </div>

      <div v-else class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-semibold text-white mb-6">
          Edit course
        </h1>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <CoursesFormFields
            v-model:title="title"
            v-model:description="description"
            v-model:num-modules="numModules"
            v-model:lessons-per-module="lessonsPerModule"
            v-model:language-level="languageLevel"
            v-model:focus="focus"
            v-model:language="language"
            v-model:tone="tone"
            :cover-url-signed="course?.cover_url_signed"
            @cover-change="onCoverChange"
          />

          <div class="pt-6 border-t border-slate-800/50">
            <CoursesSourcePdfs
              :course-id="id"
              @update:staged-pdfs="stagedPdfs = $event"
            />
          </div>

          <UiButton type="submit" :loading="loading">
            {{ loading ? 'Saving…' : 'Save changes' }}
          </UiButton>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-800/50 space-y-6">
          <div>
            <p class="text-md font-medium text-slate-300">AI Generation</p>
            <p class="text-sm text-slate-400">
                Generates the course structure (modules and lessons) from your PDFs.
                Lesson content is generated separately, on demand.
            </p>
            <div class="mt-2">
              <CoursesGenerationStatus :status="course?.generation_status ?? 'idle'" />
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <UiButton
              type="button"
              :block="false"
              :loading="generating || (course?.generation_status ? GENERATION_IN_PROGRESS.includes(course.generation_status) : false)"
              :disabled="course?.generation_status ? GENERATION_IN_PROGRESS.includes(course.generation_status) : false"
              @click="requestGenerate"
            >
              {{ generating ? 'Starting…' : isReady ? 'Re-generate course' : 'Generate course' }}
            </UiButton>

            <UiButton
              v-if="isReady"
              :to="`/dashboard/courses/${id}/structure`"
              variant="secondary"
              :block="false"
            >
              Edit course structure
            </UiButton>
          </div>

          <!-- Re-generate confirmation dialog -->
          <div v-if="showRegenConfirm" class="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 space-y-3">
            <p class="text-sm font-medium text-amber-300">Re-generate course?</p>
            <p class="text-sm text-amber-200/70">
              This will discard the current course structure (all modules and lessons) and generate a new one from your PDFs. This action cannot be undone.
            </p>
            <div class="flex gap-2">
              <UiButton type="button" :block="false" @click="handleGenerate">
                Yes, re-generate
              </UiButton>
              <UiButton type="button" variant="secondary" :block="false" @click="showRegenConfirm = false">
                Cancel
              </UiButton>
            </div>
          </div>

          <p v-if="course?.generation_error" class="text-xs text-red-400">{{ course.generation_error }}</p>
        </div>

        <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
