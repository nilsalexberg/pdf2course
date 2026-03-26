<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'] })
useHead({ title: 'New Course · pdf2course' })

const router = useRouter()
const { title, description, numModules, lessonsPerModule, languageLevel, focus, language, tone, loading, errorMessage, onCoverChange, buildFormData } = useCourseForm()

const pdfFiles = ref<File[]>([])

const PDF_MAX_SIZE = 50 * 1024 * 1024 // 50MB
const PDF_MAX_FILES = 5

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
  if (!title.value.trim()) {
    errorMessage.value = 'Title is required.'
    return
  }
  if (numModules.value < 1 || numModules.value > 50) {
    errorMessage.value = 'Number of modules must be between 1 and 50.'
    return
  }
  if (lessonsPerModule.value < 1 || lessonsPerModule.value > 20) {
    errorMessage.value = 'Lessons per module must be between 1 and 20.'
    return
  }

  loading.value = true
  try {
    const formData = buildFormData((fd) => {
      for (const pdf of pdfFiles.value) fd.append('pdfs', pdf)
    })
    await $fetch('/api/courses', { method: 'POST', body: formData })
    await router.replace('/dashboard')
  } catch (err: any) {
    errorMessage.value = err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to create course.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
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
          <CoursesFormFields
            v-model:title="title"
            v-model:description="description"
            v-model:num-modules="numModules"
            v-model:lessons-per-module="lessonsPerModule"
            v-model:language-level="languageLevel"
            v-model:focus="focus"
            v-model:language="language"
            v-model:tone="tone"
            @cover-change="onCoverChange"
          />

          <UiFileInput
            label="Source PDFs"
            accept="application/pdf"
            multiple
            help="Upload up to 5 PDFs, max 50MB each. Required for content generation."
            @change="onPdfsChange"
          />

          <UiButton type="submit" :loading="loading">
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
