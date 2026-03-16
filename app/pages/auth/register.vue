<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  user,
  (u) => {
    if (u) {
      router.replace('/auth/choose-role')
    }
  },
  { immediate: true },
)

async function handleRegister() {
  loading.value = true
  errorMessage.value = null
  try {
    const { error } = await client.auth.signUp({
      email: email.value,
      password: password.value,
    })
    if (error) throw error
  } catch (err: any) {
    errorMessage.value = err.message ?? 'Erro ao criar conta.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-6 text-center">
        Criar conta
      </h1>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="block text-sm font-medium text-slate-200 mb-1" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="voce@exemplo.com"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-200 mb-1" for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Mínimo 6 caracteres"
          >
        </div>

        <button
          type="submit"
          class="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          Criar conta
        </button>
      </form>

      <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
        {{ errorMessage }}
      </p>

      <div class="mt-6 flex items-center justify-between text-xs text-slate-400">
        <NuxtLink to="/auth/login" class="hover:text-emerald-400">
          Já tenho conta
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

