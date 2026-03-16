<script setup lang="ts">
const client = useSupabaseClient()

const email = ref('')
const loading = ref(false)
const message = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

async function handleForgot() {
  loading.value = true
  message.value = null
  errorMessage.value = null
  try {
    const config = useRuntimeConfig()
    const siteUrl = (config.public as any)?.siteUrl as string | undefined

    const { error } = await client.auth.resetPasswordForEmail(email.value, {
      redirectTo: siteUrl ? `${siteUrl}/auth/reset-password` : undefined,
    })
    if (error) throw error
    message.value = 'Se o email existir, enviaremos um link de redefinição.'
  } catch (err: any) {
    errorMessage.value = err.message ?? 'Erro ao solicitar redefinição de senha.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-6 text-center">
        Esqueci minha senha
      </h1>

      <form class="space-y-4" @submit.prevent="handleForgot">
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

        <button
          type="submit"
          class="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          Enviar link de redefinição
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm text-emerald-400">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-sm text-red-400">
        {{ errorMessage }}
      </p>

      <div class="mt-6 text-xs text-slate-400">
        <NuxtLink to="/auth/login" class="hover:text-emerald-400">
          Voltar para login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

