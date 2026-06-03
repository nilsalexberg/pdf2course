<script setup lang="ts">
  definePageMeta({ middleware: ['auth'] });

  const { profile } = useProfile();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { $authClient } = useNuxtApp();
  const authUser = useState<any>('authUser');
  const router = useRouter();

  setBreadcrumbs([{ label: 'My Account' }]);
  useHead({ title: 'My Account · pdf2course' });

  const loggingOut = ref(false);

  async function logout() {
    loggingOut.value = true;
    await $authClient.signOut();
    authUser.value = null;
    router.push('/auth/login');
  }
</script>

<template>
  <div class="max-w-2xl mx-auto py-12 px-4 space-y-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <img
          v-if="profile?.avatar_url"
          :src="profile.avatar_url"
          alt="Profile photo"
          class="h-16 w-16 rounded-full object-cover border-2 border-slate-700"
        />
        <div
          v-else
          class="h-16 w-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400"
        >
          {{ profile?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">{{ profile?.full_name || 'User' }}</h1>
          <p class="text-slate-400 text-sm capitalize">{{ profile?.role || 'user' }}</p>
        </div>
      </div>
      <UiButton variant="danger" :block="false" :loading="loggingOut" @click="logout">
        Sign out
      </UiButton>
    </div>

    <AccountProfileForm />
    <AccountPasswordForm />
  </div>
</template>
