<script setup lang="ts">
  import type { User } from 'better-auth';

  definePageMeta({ layout: 'blank' });
  useHead({ title: 'Register · pdf2course' });

  const { $authClient } = useNuxtApp();
  const authUser = useState<User | null>('authUser');
  const router = useRouter();

  const email = ref('');
  const password = ref('');
  const name = ref('');
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);

  watch(
    authUser,
    (u) => {
      if (u) {
        router.replace('/dashboard');
      }
    },
    { immediate: true }
  );

  async function handleRegister() {
    loading.value = true;
    errorMessage.value = null;
    try {
      const { data, error } = await $authClient.signUp.email({
        email: email.value,
        password: password.value,
        name: name.value
      });
      if (error) throw error;
      authUser.value = data?.user ?? null;
    } catch (err: unknown) {
      errorMessage.value = (err as Error)?.message ?? 'Error creating account.';
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <h1 class="text-2xl font-semibold text-white mb-6 text-center">Create account</h1>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <UiInput id="name" v-model="name" type="text" label="Name" placeholder="Your name" />

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
          placeholder="Minimum 8 characters"
          required
          minlength="8"
        />

        <UiButton type="submit" :loading="loading"> Create account </UiButton>
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
