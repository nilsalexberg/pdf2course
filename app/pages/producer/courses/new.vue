<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'role'] })

const router = useRouter()

const title = ref('')
const description = ref('')
const numModules = ref(5)
const lessonsPerModule = ref(4)
const coverFile = ref<File | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

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

    await $fetch('/api/courses', {
      method: 'POST',
      body: formData,
    })

    await router.replace('/producer')
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
        <NuxtLink to="/producer" class="text-sm text-slate-400 hover:text-slate-300">
          ← Back to dashboard
        </NuxtLink>
      </div>

      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 class="text-2xl font-semibold text-white mb-6">
          New course
        </h1>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-slate-200 mb-1" for="title">Title</label>
            <input
              id="title"
              v-model="title"
              type="text"
              required
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Course title"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-200 mb-1" for="description">Description</label>
            <textarea
              id="description"
              v-model="description"
              rows="3"
              class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Optional short description"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-200 mb-1">Cover image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 file:font-medium file:cursor-pointer hover:file:bg-slate-600"
              @change="onCoverChange"
            >
            <p class="mt-1 text-xs text-slate-500">
              Optional. JPEG, PNG or WebP, max 5MB.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-200 mb-1" for="num_modules">Number of modules</label>
              <input
                id="num_modules"
                v-model.number="numModules"
                type="number"
                min="1"
                max="50"
                required
                class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-200 mb-1" for="lessons_per_module">Lessons per module</label>
              <input
                id="lessons_per_module"
                v-model.number="lessonsPerModule"
                type="number"
                min="1"
                max="20"
                required
                class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
            </div>
          </div>

          <button
            type="submit"
            class="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            {{ loading ? 'Creating…' : 'Create course' }}
          </button>
        </form>

        <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
