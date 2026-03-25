<script setup lang="ts">
useHead({ title: 'Register · pdf2course' })

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  user,
  (u: any) => {
    if (u) {
      router.replace('/dashboard')
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
    errorMessage.value = err.message ?? 'Error creating account.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-6 text-center">
        Create account
      </h1>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <UiInput
          id="email"
          v-model="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
        />

        <UiInput
          id="password"
          v-model="password"
          type="password"
          label="Password"
          placeholder="Minimum 6 characters"
          required
          minlength="6"
        />

        <UiButton
          type="submit"
          :loading="loading"
        >
          Create account
        </UiButton>
      </form>

      <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
        {{ errorMessage }}
      </p>

      <div class="mt-6 flex items-center justify-between text-xs text-slate-400">
        <NuxtLink to="/auth/login" class="hover:text-emerald-400">
          I already have an account
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

