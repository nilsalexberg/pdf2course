<script setup lang="ts">
  definePageMeta({ layout: 'blank' });
  useHead({ title: 'Reset Password · pdf2course' });

  const { $authClient } = useNuxtApp();
  const router = useRouter();
  const route = useRoute();

  const password = ref('');
  const loading = ref(false);
  const message = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);

  const token = computed(() => route.query.token as string | undefined);

  async function handleReset() {
    if (!token.value) {
      errorMessage.value = 'Invalid or missing reset token.';
      return;
    }
    loading.value = true;
    message.value = null;
    errorMessage.value = null;
    try {
      const { error } = await $authClient.resetPassword({
        newPassword: password.value,
        token: token.value
      });
      if (error) throw error;
      message.value = 'Password successfully changed. Redirecting to login...';
      setTimeout(() => router.replace('/auth/login'), 1500);
    } catch (err: any) {
      errorMessage.value = err?.message ?? 'Error resetting password.';
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-6 text-center">Set new password</h1>

      <form class="space-y-4" @submit.prevent="handleReset">
        <UiInput
          id="password"
          v-model="password"
          type="password"
          label="New password"
          placeholder="Minimum 8 characters"
          required
          minlength="8"
        />

        <UiButton type="submit" :loading="loading"> Save new password </UiButton>
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
