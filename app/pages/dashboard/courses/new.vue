<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'] })
import { COURSE_LANGUAGE_LEVELS, COURSE_FOCUS_OPTIONS, COURSE_LANGUAGES, COURSE_TONES } from '@@/types/courseConfig'

const router = useRouter()

const title = ref('')
const description = ref('')
const numModules = ref(5)
const lessonsPerModule = ref(4)
const languageLevel = ref<string>(COURSE_LANGUAGE_LEVELS[0])
const focus = ref<string>(COURSE_FOCUS_OPTIONS[0])
const language = ref<string>(COURSE_LANGUAGES[0])
const tone = ref<string>(COURSE_TONES[0])
const coverFile = ref<File | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const pdfFiles = ref<File[]>([])

const COVER_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const PDF_MAX_SIZE = 50 * 1024 * 1024 // 50MB
const PDF_MAX_FILES = 5

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

function onPdfsChange(e: Event) {
  errorMessage.value = null
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  
  if (files.length > PDF_MAX_FILES) {
    errorMessage.value = `You can upload at most ${PDF_MAX_FILES} PDFs.`
    pdfFiles.value = []
    input.value = ''
    return
  }

  for (const file of files) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      errorMessage.value = `File "${file.name}" is not a PDF.`
      pdfFiles.value = []
      input.value = ''
      return
    }
    if (file.size > PDF_MAX_SIZE) {
      errorMessage.value = `PDF "${file.name}" exceeds the 50MB limit.`
      pdfFiles.value = []
      input.value = ''
      return
    }
  }

  pdfFiles.value = files
}

async function handleSubmit() {
  errorMessage.value = null
  const t = title.value.trim()
  if (!t) {
    errorMessage.value = 'Title is required.'
    return
  }
  const num = numModules.value
  const less = lessonsPerModule.value
  if (num < 1 || num > 50) {
    errorMessage.value = 'Number of modules must be between 1 and 50.'
    return
  }
  if (less < 1 || less > 20) {
    errorMessage.value = 'Lessons per module must be between 1 and 20.'
    return
  }

  loading.value = true
  try {
    const formData = new FormData()
    formData.set('title', t)
    formData.set('description', description.value.trim())
    formData.set('num_modules', String(num))
    formData.set('lessons_per_module', String(less))
    if (coverFile.value) {
      formData.set('cover', coverFile.value)
    }
    formData.set('language_level', languageLevel.value)
    formData.set('focus', focus.value)
    formData.set('language', language.value)
    formData.set('tone', tone.value)

    for (const pdf of pdfFiles.value) {
      formData.append('pdfs', pdf)
    }

    await $fetch('/api/courses', {
      method: 'POST',
      body: formData,
    })

    await router.replace('/dashboard')
  } catch (err: any) {
    const msg = err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to create course.'
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

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-semibold text-white mb-6">
          New course
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

          <UiFileInput
            label="Cover image"
            accept="image/jpeg,image/png,image/webp"
            help="Optional. JPEG, PNG or WebP, max 5MB."
            @change="onCoverChange"
          />

          <UiFileInput
            label="Source PDFs"
            accept="application/pdf"
            multiple
            help="Upload up to 5 PDFs, max 50MB each. Required for content generation."
            @change="onPdfsChange"
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

          <div class="grid grid-cols-2 gap-4">
            <UiSelect
              id="language_level"
              v-model="languageLevel"
              label="Language level"
              :options="COURSE_LANGUAGE_LEVELS"
              required
            />
            <UiSelect
              id="focus"
              v-model="focus"
              label="Educational focus"
              :options="COURSE_FOCUS_OPTIONS"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UiSelect
              id="language"
              v-model="language"
              label="Target language"
              :options="COURSE_LANGUAGES"
              required
            />
            <UiSelect
              id="tone"
              v-model="tone"
              label="Course tone"
              :options="COURSE_TONES"
              required
            />
          </div>

          <UiButton
            type="submit"
            :loading="loading"
          >
            {{ loading ? 'Creating…' : 'Create course' }}
          </UiButton>
        </form>

        <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
