<script setup lang="ts">
  definePageMeta({ layout: 'blank' });
  useHead({ title: 'Forgot Password · pdf2course' });

  const { $authClient } = useNuxtApp();

  const email = ref('');
  const loading = ref(false);
  const message = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);

  async function handleForgot() {
    loading.value = true;
    message.value = null;
    errorMessage.value = null;
    try {
      const { error } = await $authClient.requestPasswordReset({
        email: email.value,
        redirectTo: '/auth/reset-password'
      });
      if (error) throw error;
      message.value = 'If the email exists, we will send a reset link.';
    } catch (err: unknown) {
      errorMessage.value = (err as Error)?.message ?? 'Error requesting password reset.';
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-6 text-center">Forgot my password</h1>

      <form class="space-y-4" @submit.prevent="handleForgot">
        <UiInput
          id="email"
          v-model="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
        />

        <UiButton type="submit" :loading="loading"> Send reset link </UiButton>
      </form>

      <p v-if="message" class="mt-4 text-sm text-emerald-400">
        {{ message }}
      </p>
      <p v-if="errorMessage" class="mt-2 text-sm text-red-400">
        {{ errorMessage }}
      </p>

      <div class="mt-6 text-xs text-slate-400">
        <NuxtLink to="/auth/login" class="hover:text-emerald-400"> Back to login </NuxtLink>
      </div>
    </div>
  </div>
</template>
