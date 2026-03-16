<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

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

    if (data?.role === 'producer') {
      router.replace('/producer')
    } else {
      router.replace('/learn')
    }
  } catch (err: any) {
    errorMessage.value = err.message ?? 'Não foi possível definir o perfil.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-4 text-center">
        Como você vai usar o pdf2course?
      </h1>
      <p class="text-sm text-slate-300 mb-6 text-center">
        Escolha um perfil para personalizar sua experiência. Você poderá pedir ao suporte para mudar depois.
      </p>

      <div class="space-y-4">
        <button
          type="button"
          class="w-full rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-left hover:bg-emerald-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="choose('producer')"
        >
          <div class="text-sm font-semibold text-emerald-300">
            Produtor de cursos
          </div>
          <div class="text-xs text-slate-300 mt-1">
            Crie cursos gamificados a partir de PDFs e gerencie seus alunos.
          </div>
        </button>

        <button
          type="button"
          class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-left hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="choose('student')"
        >
          <div class="text-sm font-semibold text-slate-100">
            Estudante
          </div>
          <div class="text-xs text-slate-300 mt-1">
            Acesse cursos e acompanhe seu progresso em formato Duolingo-style.
          </div>
        </button>
      </div>

      <p v-if="errorMessage" class="mt-4 text-sm text-red-400 text-center">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

