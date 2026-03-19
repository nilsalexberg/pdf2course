<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const { refresh } = useProfile()

const loading = ref(false)
const errorMessage = ref<string | null>(null)

onMounted(() => {
  if (!user.value) {
    router.replace('/auth/login')
  }
})

async function choose(role: 'producer' | 'student') {
  loading.value = true
  errorMessage.value = null
  try {
    const { data, error } = await client.rpc('set_role', { new_role: role })
    if (error) throw error
    
    await refresh()

    if (data?.role === 'producer') {
      await navigateTo('/producer', { replace: true })
    } else {
      await navigateTo('/learn', { replace: true })
    }
  } catch (err: any) {
    errorMessage.value = err.message ?? 'Could not set profile.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-4 text-center">
        How will you use pdf2course?
      </h1>
      <p class="text-sm text-slate-300 mb-6 text-center">
        Choose a profile to personalize your experience. You can ask support to change it later.
      </p>

      <div class="space-y-4">
        <button
          type="button"
          class="relative w-full rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-left hover:bg-emerald-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="choose('producer')"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold text-emerald-300">
              Course producer
            </div>
            <UiSpinner v-if="loading" class="w-4 h-4 text-emerald-500" />
          </div>
          <div class="text-xs text-slate-300 mt-1">
            Create gamified courses from PDFs and manage your students.
          </div>
        </button>

        <button
          type="button"
          class="relative w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-left hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="choose('student')"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold text-slate-100">
              Student
            </div>
            <UiSpinner v-if="loading" class="w-4 h-4 text-slate-400" />
          </div>
          <div class="text-xs text-slate-300 mt-1">
            Access courses and track your progress in a Duolingo-style format.
          </div>
        </button>
      </div>

      <p v-if="errorMessage" class="mt-4 text-sm text-red-400 text-center">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

