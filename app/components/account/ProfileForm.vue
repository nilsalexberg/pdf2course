<script setup lang="ts">
  import { FetchError } from 'ofetch';

  const { profile, refresh } = useProfile();

  const fullName = ref(profile.value?.full_name ?? '');
  const avatarPreview = ref<string | null>(profile.value?.avatar_url ?? null);
  const avatarFile = ref<File | null>(null);
  const saving = ref(false);
  const alert = ref<{ type: 'success' | 'error'; message: string } | null>(null);

  watch(
    () => profile.value,
    (p) => {
      if (p) {
        fullName.value = p.full_name ?? '';
        avatarPreview.value = p.avatar_url ?? null;
      }
    }
  );

  function onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    avatarFile.value = file;
    avatarPreview.value = URL.createObjectURL(file);
  }

  async function save() {
    saving.value = true;
    alert.value = null;
    try {
      if (avatarFile.value) {
        const form = new FormData();
        form.append('avatar', avatarFile.value);
        await $fetch('/api/me/avatar', { method: 'POST', body: form });
        avatarFile.value = null;
      }
      await $fetch('/api/me', { method: 'PATCH', body: { full_name: fullName.value } });
      await refresh();
      alert.value = { type: 'success', message: 'Profile updated successfully.' };
    } catch (err) {
      let message = 'Failed to update profile.';
      if (err instanceof FetchError) {
        message = err.data?.statusMessage || 'Failed to update profile.';
      }
      alert.value = {
        type: 'error',
        message
      };
    } finally {
      saving.value = false;
    }
  }
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
    <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
      <svg
        class="w-5 h-5 text-emerald-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      Personal Information
    </h2>

    <form class="space-y-5" @submit.prevent="save">
      <!-- Avatar -->
      <div class="flex items-center gap-5">
        <div class="relative shrink-0">
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            alt="Profile photo"
            class="h-20 w-20 rounded-full object-cover border-2 border-slate-700"
          />
          <div
            v-else
            class="h-20 w-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-bold text-slate-400"
          >
            {{ profile?.full_name?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <UiFileInput
            id="avatar"
            label="Profile photo"
            accept="image/jpeg,image/png,image/webp"
            help="JPEG, PNG or WebP · max 5 MB"
            @change="onAvatarChange"
          />
        </div>
      </div>

      <!-- Name -->
      <UiInput
        id="full_name"
        v-model="fullName"
        label="Full name"
        placeholder="Your name"
        required
      />

      <UiAlert v-if="alert" :type="alert.type" :message="alert.message" />

      <UiButton type="submit" :loading="saving" :block="false"> Save changes </UiButton>
    </form>
  </div>
</template>
