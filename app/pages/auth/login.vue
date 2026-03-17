<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const route = useRoute()
const redirect = computed(() => (route.query.redirect as string | undefined) ?? '/')

watch(
  user,
  (u) => {
    if (u) {
      router.replace(redirect.value)
    }
  },
  { immediate: true },
)

async function handleEmailLogin() {
  loading.value = true
  errorMessage.value = null
  try {
    const { error } = await client.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (error) throw error
  } catch (err: any) {
    errorMessage.value = err.message ?? 'Error logging in.'
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  loading.value = true
  errorMessage.value = null
  try {
    const config = useRuntimeConfig()
    const siteUrl = (config.public as any)?.siteUrl as string | undefined

    await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: siteUrl ? `${siteUrl}/auth/confirm` : undefined,
      },
    })
  } catch (err: any) {
    errorMessage.value = err.message ?? 'Error logging in with Google.'
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-6 text-center">
        Log in to pdf2course
      </h1>

      <form class="space-y-4" @submit.prevent="handleEmailLogin">
        <div>
          <label class="block text-sm font-medium text-slate-200 mb-1" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="you@example.com"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-200 mb-1" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="••••••••"
          >
        </div>

        <button
          type="submit"
          class="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          Log in
        </button>

        <button
          type="button"
          class="w-full inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="handleGoogleLogin"
        >
          Continue with Google
        </button>
      </form>

      <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
        {{ errorMessage }}
      </p>

      <div class="mt-6 flex items-center justify-between text-xs text-slate-400">
        <NuxtLink to="/auth/register" class="hover:text-emerald-400">
          Create account
        </NuxtLink>
        <NuxtLink to="/auth/forgot-password" class="hover:text-emerald-400">
          Forgot my password
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

