<script setup lang="ts">
  import type { Lesson } from '@@/types/course';

  const props = defineProps<{
    lesson: Lesson;
  }>();

  const emit = defineEmits<{
    'update:lesson': [lesson: Lesson];
  }>();

  const isGenerating = ref(false);
  const isInProgress = computed(() => isGenerating.value || props.lesson.status === 'generating');

  async function generateContent() {
    if (isInProgress.value) return;
    isGenerating.value = true;

    try {
      const updated = await $fetch<Lesson>(
        `/api/courses/${props.lesson.courseId}/lessons/${props.lesson.id}/generate`,
        { method: 'POST' }
      );
      emit('update:lesson', updated);
    } catch (err: any) {
      emit('update:lesson', {
        ...props.lesson,
        status: 'failed',
        generationError: err?.data?.statusMessage ?? err?.message ?? 'Unknown error'
      });
    } finally {
      isGenerating.value = false;
    }
  }
</script>

<template>
  <UiButton
    v-if="isInProgress"
    disabled
    size="xs"
    variant="secondary"
    :loading="true"
    :block="false"
  >
    Generating…
  </UiButton>

  <UiButton
    v-else
    size="xs"
    variant="secondary"
    :block="false"
    class="gap-2"
    @click="generateContent"
  >
    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
    {{ lesson.status === 'failed' ? 'Retry' : 'Generate Content' }}
  </UiButton>
</template>
