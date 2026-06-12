<script setup lang="ts">
  import { FetchError } from 'ofetch';
  const props = defineProps<{
    courseId: string | null;
  }>();

  const emit = defineEmits<{
    close: [];
    rejected: [];
  }>();

  const rejectReason = ref('');
  const loading = ref(false);
  const error = ref<string | null>(null);

  watch(
    () => props.courseId,
    (val) => {
      if (val) {
        rejectReason.value = '';
        error.value = null;
      }
    }
  );

  async function confirm() {
    if (!props.courseId) return;
    error.value = null;
    loading.value = true;
    try {
      await $fetch(`/api/admin/courses/${props.courseId}/reject`, {
        method: 'POST',
        body: { reason: rejectReason.value }
      });
      emit('rejected');
      emit('close');
    } catch (err) {
      if (err instanceof FetchError) {
        error.value = err.data?.statusMessage || 'Failed to reject course';
      } else {
        error.value = 'Failed to reject course';
      }
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <div
    v-if="courseId"
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
    @click.self="emit('close')"
  >
    <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold text-white mb-4">Reject course</h3>
      <UiTextarea
        v-model="rejectReason"
        placeholder="Explain why this course is being rejected..."
        class="mb-4"
        :rows="4"
      />
      <p v-if="error" class="text-sm text-red-400 mb-3">
        {{ error }}
      </p>
      <div class="flex gap-3 justify-end">
        <UiButton variant="secondary" :block="false" :disabled="loading" @click="emit('close')">
          Cancel
        </UiButton>
        <UiButton
          variant="danger"
          :block="false"
          :loading="loading"
          :disabled="!rejectReason.trim()"
          @click="confirm"
        >
          Reject
        </UiButton>
      </div>
    </div>
  </div>
</template>
