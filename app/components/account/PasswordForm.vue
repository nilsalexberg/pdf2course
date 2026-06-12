<script setup lang="ts">
  const { $authClient } = useNuxtApp();

  const currentPassword = ref('');
  const newPassword = ref('');
  const confirmPassword = ref('');
  const saving = ref(false);
  const alert = ref<{ type: 'success' | 'error'; message: string } | null>(null);

  async function updatePassword() {
    alert.value = null;

    if (newPassword.value.length < 8) {
      alert.value = { type: 'error', message: 'Password must be at least 8 characters.' };
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      alert.value = { type: 'error', message: 'Passwords do not match.' };
      return;
    }

    saving.value = true;
    try {
      const { error } = await $authClient.changePassword({
        newPassword: newPassword.value,
        currentPassword: currentPassword.value,
        revokeOtherSessions: false
      });
      if (error) throw error;
      alert.value = { type: 'success', message: 'Password updated successfully.' };
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
    } catch (err: unknown) {
      alert.value = { type: 'error', message: (err as Error).message || 'Failed to update password.' };
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
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      Change Password
    </h2>

    <form class="space-y-5" @submit.prevent="updatePassword">
      <UiInput
        id="current_password"
        v-model="currentPassword"
        label="Current password"
        type="password"
        placeholder="Your current password"
        required
      />
      <UiInput
        id="new_password"
        v-model="newPassword"
        label="New password"
        type="password"
        placeholder="At least 8 characters"
        required
        minlength="8"
      />
      <UiInput
        id="confirm_password"
        v-model="confirmPassword"
        label="Confirm new password"
        type="password"
        placeholder="Repeat new password"
        required
      />

      <UiAlert v-if="alert" :type="alert.type" :message="alert.message" />

      <UiButton type="submit" :loading="saving" :block="false"> Update password </UiButton>
    </form>
  </div>
</template>
