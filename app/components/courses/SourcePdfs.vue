<script setup lang="ts">
  import type { CoursePdf } from '@@/types/course';

  const props = defineProps<{
    courseId: string;
    readonly?: boolean;
  }>();

  const emit = defineEmits<{
    'update:stagedPdfs': [files: File[]];
  }>();

  const {
    data: pdfs,
    refresh,
    pending
  } = await useFetch<CoursePdf[]>(`/api/courses/${props.courseId}/pdfs`);

  const openingId = ref<string | null>(null);

  async function handleOpen(pdf: CoursePdf) {
    openingId.value = pdf.id;
    try {
      const { url } = await $fetch<{ url: string }>(
        `/api/courses/${props.courseId}/pdfs/${pdf.id}/signed-url`
      );
      window.open(url, '_blank');
    } finally {
      openingId.value = null;
    }
  }

  const deletingId = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);

  async function handleDelete(pdfId: string) {
    if (!confirm('Are you sure you want to delete this PDF source? This cannot be undone.')) return;

    errorMessage.value = null;
    deletingId.value = pdfId;
    try {
      await $fetch(`/api/courses/${props.courseId}/pdfs/${pdfId}`, {
        method: 'DELETE'
      });
      await refresh();
    } catch (err: unknown) {
      errorMessage.value = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete PDF.';
    } finally {
      deletingId.value = null;
    }
  }

  function onFilesChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    emit('update:stagedPdfs', files);
  }

  function formatSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-slate-400 uppercase tracking-wider">
        Current Source PDFs
      </h3>

      <div v-if="pending" class="flex justify-center py-4">
        <UiSpinner class="w-6 h-6 text-emerald-500" />
      </div>

      <div v-else-if="!pdfs?.length" class="text-sm text-slate-500 italic py-2">
        No PDF sources uploaded yet.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="pdf in pdfs"
          :key="pdf.id"
          class="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl group hover:border-slate-600 transition-colors"
        >
          <div class="min-w-0 flex-1 mr-4">
            <p class="text-sm font-medium text-slate-200 truncate" :title="pdf.filename">
              {{ pdf.filename }}
            </p>
            <p class="text-xs text-slate-500">
              {{ formatSize(pdf.sizeBytes) }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="text-xs font-medium text-emerald-400 hover:text-emerald-300 px-2 py-1 disabled:opacity-50"
              :disabled="openingId === pdf.id"
              @click="handleOpen(pdf)"
            >
              <span v-if="openingId === pdf.id">Opening...</span>
              <span v-else>Open</span>
            </button>

            <button
              v-if="!readonly"
              type="button"
              class="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors"
              :disabled="!!deletingId"
              @click="handleDelete(pdf.id)"
            >
              <div
                v-if="deletingId === pdf.id"
                class="w-4 h-4 border-2 border-red-400 border-t-transparent animate-spin rounded-full"
              ></div>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    <UiFileInput
      v-if="!readonly"
      label="Add more PDFs"
      accept="application/pdf"
      multiple
      help="Upload additional sources. Max 5 PDFs total, 50MB each."
      @change="onFilesChange"
    />

    <p v-if="errorMessage" class="text-xs text-red-400">
      {{ errorMessage }}
    </p>
  </div>
</template>
