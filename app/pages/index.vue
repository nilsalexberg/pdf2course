<script setup lang="ts">
  import type { User } from 'better-auth';

  useHead({ title: 'pdf2course' });

  const authUser = useState<User | null>('authUser');
  const { profile, refresh } = useProfile();

  watch(
    authUser,
    async (u) => {
      if (!u) return navigateTo('/auth/login');

      if (!profile.value) {
        await refresh();
      }

      const role = profile.value?.role;

      if (role === 'admin') {
        return navigateTo('/admin');
      }

      return navigateTo('/dashboard');
    },
    { immediate: true }
  );
</script>

<template>
  <div class="min-h-screen grid place-items-center text-sm text-gray-600">Redirecting…</div>
</template>
