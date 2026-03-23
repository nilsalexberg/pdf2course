<script setup lang="ts">
import type { CourseWithSignedCover, Course } from '@@/types/course'

definePageMeta({ middleware: ['auth', 'role'] })

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
 
const { data: course, pending, error } = await useFetch<CourseWithSignedCover>(`/api/courses/${id}`)

const title = ref('')
const description = ref('')
const numModules = ref(5)
const lessonsPerModule = ref(4)
const coverFile = ref<File | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const stagedPdfs = ref<File[]>([])
const generating = ref(false)

async function handleGenerate() {
  errorMessage.value = null
  generating.value = true
  try {
    const updated = await $fetch<Course>(`/api/courses/${id}/generate`, { method: 'POST' })
    if (course.value) {
      course.value = { ...course.value, ...updated }
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to start generation.'
  } finally {
    generating.value = false
  }
}

// Initialize form with course data
watch(course as any, (newCourse: CourseWithSignedCover | null) => {
  if (newCourse) {
    title.value = newCourse.title
    description.value = newCourse.description || ''
    numModules.value = newCourse.config?.num_modules ?? 5
    lessonsPerModule.value = newCourse.config?.lessons_per_module ?? 4
  }
}, { immediate: true })

const COVER_MAX_SIZE = 5 * 1024 * 1024 // 5MB

function onCoverChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    coverFile.value = null
    return
  }
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please choose a JPEG, PNG or WebP image.'
    coverFile.value = null
    input.value = ''
    return
  }
  if (file.size > COVER_MAX_SIZE) {
    errorMessage.value = 'Cover image must be at most 5MB.'
    coverFile.value = null
    input.value = ''
    return
  }
  errorMessage.value = null
  coverFile.value = file
}

async function handleSubmit() {
  errorMessage.value = null
  const t = title.value.trim()
  if (!t) {
    errorMessage.value = 'Title is required.'
    return
  }
  
  loading.value = true
  try {
    const formData = new FormData()
    formData.set('title', t)
    formData.set('description', description.value.trim())
    formData.set('num_modules', String(numModules.value))
    formData.set('lessons_per_module', String(lessonsPerModule.value))
    if (coverFile.value) {
      formData.set('cover', coverFile.value)
    }

    for (const pdf of stagedPdfs.value) {
      formData.append('pdfs', pdf)
    }

    await $fetch(`/api/courses/${id}`, {
      method: 'PUT',
      body: formData,
    } as any)

    await router.replace('/dashboard')
  } catch (err: any) {
    const msg = err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to update course.'
    errorMessage.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-lg mx-auto px-4 py-8">
      <div class="mb-6">
        <NuxtLink to="/dashboard" class="text-sm text-slate-400 hover:text-slate-300">
          ← Back to dashboard
        </NuxtLink>
      </div>

      <div v-if="pending" class="flex justify-center py-12">
        <UiSpinner class="w-8 h-8 text-emerald-500" />
      </div>

      <div v-else-if="error" class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-red-400">
        <p>{{ error.message || 'Failed to load course details.' }}</p>
        <NuxtLink to="/dashboard" class="mt-4 inline-block text-sm text-emerald-400">
          Back to dashboard
        </NuxtLink>
      </div>

      <div v-else class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-semibold text-white mb-6">
          Edit course
        </h1>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <UiInput
            id="title"
            v-model="title"
            type="text"
            label="Title"
            placeholder="Course title"
            required
          />

          <UiTextarea
            id="description"
            v-model="description"
            label="Description"
            placeholder="Optional short description"
            :rows="3"
          />

          <div v-if="course?.cover_url_signed" class="mb-2">
            <p class="text-sm text-slate-400 mb-2">Current cover:</p>
            <img :src="course.cover_url_signed" class="w-full h-32 object-cover rounded-lg border border-slate-800" />
          </div>

          <UiFileInput
            label="Change cover image"
            accept="image/jpeg,image/png,image/webp"
            help="Optional. JPEG, PNG or WebP, max 5MB. Leave empty to keep current."
            @change="onCoverChange"
          />

          <div class="grid grid-cols-2 gap-4">
            <UiInput
              id="num_modules"
              v-model.number="numModules"
              type="number"
              label="Number of modules"
              required
              :min="1"
              :max="50"
            />
            <UiInput
              id="lessons_per_module"
              v-model.number="lessonsPerModule"
              type="number"
              label="Lessons per module"
              required
              :min="1"
              :max="20"
            />
          </div>

          <div class="pt-6 border-t border-slate-800/50">
            <CoursesSourcePdfs 
              :course-id="id"
              @update:staged-pdfs="stagedPdfs = $event"
            />
          </div>

          <UiButton
            type="submit"
            :loading="loading"
          >
            {{ loading ? 'Saving…' : 'Save changes' }}
          </UiButton>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-800/50 space-y-6">
          <div>
            <p class="text-sm font-medium text-slate-300">AI Generation</p>
            <div class="mt-2">
              <CoursesGenerationStatus :status="course?.generation_status ?? 'idle'" />
            </div>
          </div>
          <UiButton
            type="button"
            :loading="generating"
            :disabled="course?.generation_status === 'processing' || course?.generation_status === 'generating_structure'"
            @click="handleGenerate"
          >
            {{ generating ? 'Starting…' : 'Generate course' }}
          </UiButton>

          <p v-if="course?.generation_error" class="text-xs text-red-400">{{ course.generation_error }}</p>
        </div>

        <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
