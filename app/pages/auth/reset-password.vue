<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()

const password = ref('')
const loading = ref(false)
const message = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

async function handleReset() {
  loading.value = true
  message.value = null
  errorMessage.value = null
  try {
    const { error } = await client.auth.updateUser({
      password: password.value,
    })
    if (error) throw error
    message.value = 'Password successfully changed. Redirecting to login...'
    setTimeout(() => router.replace('/auth/login'), 1500)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'Error resetting password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-6 text-center">
        Set new password
      </h1>

      <form class="space-y-4" @submit.prevent="handleReset">
        <div>
          <label class="block text-sm font-medium text-slate-200 mb-1" for="password">New password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Minimum 6 characters"
          >
        </div>

        <button
          type="submit"
          class="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          Save new password
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm text-emerald-400">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-sm text-red-400">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

