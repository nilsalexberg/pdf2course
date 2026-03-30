<script setup lang="ts">
import type { CourseWithSignedCover, Course } from '@@/types/course'
import { GENERATION_IN_PROGRESS } from '@@/types/course'

const props = defineProps<{
  course: CourseWithSignedCover | null | undefined
  courseId: string
}>()

const emit = defineEmits<{
  'update:course': [course: CourseWithSignedCover]
}>()

const generating = ref(false)
const showRegenConfirm = ref(false)
const submittingReview = ref(false)
const errorMessage = ref<string | null>(null)

const isReady = computed(() => props.course?.generation_status === 'ready')
const isGenerationInProgress = computed(() =>
  props.course?.generation_status ? GENERATION_IN_PROGRESS.includes(props.course.generation_status) : false
)

const canRegenerate = computed(() =>
  props.course?.status !== 'pending_review' && props.course?.status !== 'approved'
)

const canSubmitReview = computed(() =>
  isReady.value && (props.course?.status === 'draft' || props.course?.status === 'rejected')
)

const courseStatusLabel = computed(() => {
  switch (props.course?.status) {
    case 'draft': return 'Draft'
    case 'pending_review': return 'Under review'
    case 'approved': return 'Published'
    case 'rejected': return 'Rejected'
    default: return '—'
  }
})

const courseStatusClass = computed(() => {
  switch (props.course?.status) {
    case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-700/50'
    case 'pending_review': return 'bg-amber-400/10 text-amber-400 border-amber-400/20'
    case 'approved': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
    case 'rejected': return 'bg-red-400/10 text-red-400 border-red-400/20'
    default: return 'bg-slate-500/10 text-slate-400 border-slate-700/50'
  }
})

function requestGenerate() {
  if (isReady.value) {
    showRegenConfirm.value = true
  } else {
    handleGenerate()
  }
}

async function handleGenerate() {
  showRegenConfirm.value = false
  errorMessage.value = null
  generating.value = true
  try {
    const updated = await $fetch<Course>(`/api/courses/${props.courseId}/generate`, { method: 'POST' })
    if (props.course) emit('update:course', { ...props.course, ...updated })
  } catch (err: any) {
    errorMessage.value = err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to start generation.'
  } finally {
    generating.value = false
  }
}

async function handleSubmitReview() {
  errorMessage.value = null
  submittingReview.value = true
  try {
    const updated = await $fetch<Course>(`/api/courses/${props.courseId}/submit-review`, { method: 'POST' })
    if (props.course) emit('update:course', { ...props.course, ...updated })
  } catch (err: any) {
    errorMessage.value = err?.data?.message ?? err?.message ?? err?.statusMessage ?? 'Failed to submit for review.'
  } finally {
    submittingReview.value = false
  }
}
</script>

<template>
  <div class="space-y-8">

    <!-- AI Generation section -->
    <div class="space-y-4">
      <div>
        <p class="text-base font-semibold text-white">Step 1 — Generate course structure</p>
        <p class="mt-1 text-sm text-slate-400">
          The AI reads your uploaded PDFs and builds the full course structure: modules, lessons, objectives, and key topics.
          Once the structure is ready, you can review and edit it before publishing.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</span>
        <CoursesGenerationStatus :status="course?.generation_status ?? 'idle'" />
      </div>

      <div class="flex flex-wrap gap-3">
        <UiButton
          type="button"
          :block="false"
          :loading="generating || isGenerationInProgress"
          :disabled="!canRegenerate || isGenerationInProgress"
          @click="requestGenerate"
        >
          {{ generating ? 'Starting…' : isReady ? 'Re-generate structure' : 'Generate structure' }}
        </UiButton>

        <UiButton
          v-if="isReady"
          :to="`/dashboard/courses/${courseId}/structure`"
          variant="secondary"
          :block="false"
          :disabled="!canRegenerate || isGenerationInProgress"
        >
          Edit structure
        </UiButton>
      </div>

      <p v-if="!canRegenerate" class="text-xs text-amber-400/80">
        Re-generation or editing is disabled while the course is under review or published.
      </p>

      <!-- Re-generate confirmation dialog -->
      <div v-if="showRegenConfirm" class="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 space-y-3">
        <p class="text-sm font-medium text-amber-300">Re-generate structure?</p>
        <p class="text-sm text-amber-200/70">
          This will discard the current course structure (all modules and lessons) and generate a new one from your PDFs. This action cannot be undone.
        </p>
        <div class="flex gap-2">
          <UiButton type="button" :block="false" @click="handleGenerate">
            Yes, re-generate
          </UiButton>
          <UiButton type="button" variant="secondary" :block="false" @click="showRegenConfirm = false">
            Cancel
          </UiButton>
        </div>
      </div>

      <p v-if="course?.generation_error" class="text-xs text-red-400">{{ course.generation_error }}</p>
    </div>

    <!-- Divider -->
    <div class="border-t border-slate-800/50" />

    <!-- Publishing section -->
    <div class="space-y-4">
      <div>
        <p class="text-base font-semibold text-white">Step 2 — Send for review</p>
        <p class="mt-1 text-sm text-slate-400">
          Once the course structure is generated and you're happy with it, submit it for admin review.
          After approval, your course will be published and available to learners.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Course status</span>
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
          :class="courseStatusClass"
        >
          {{ courseStatusLabel }}
        </span>
      </div>

      <div v-if="course?.status === 'rejected' && course.rejection_reason" class="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
        <p class="text-sm font-medium text-red-400">Rejection reason</p>
        <p class="mt-1 text-sm text-red-300/80">{{ course.rejection_reason }}</p>
        <p class="mt-2 text-xs text-slate-400">Address the feedback above, then re-generate or submit again.</p>
      </div>

      <div v-if="course?.status === 'pending_review'" class="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
        <p class="text-sm text-amber-300/80">Your course is currently under review. You'll be notified once an admin has evaluated it.</p>
      </div>

      <div v-if="course?.status === 'approved'" class="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
        <p class="text-sm text-emerald-300/80">Your course is published and visible to learners.</p>
      </div>

      <UiButton
        v-if="canSubmitReview"
        type="button"
        :block="false"
        :loading="submittingReview"
        @click="handleSubmitReview"
      >
        {{ submittingReview ? 'Submitting…' : course?.status === 'rejected' ? 'Re-submit for review' : 'Send for review' }}
      </UiButton>

      <p v-else-if="!isReady && course?.status !== 'pending_review' && course?.status !== 'approved'" class="text-xs text-slate-500">
        Generate the course structure first to unlock this step.
      </p>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-400">
      {{ errorMessage }}
    </p>
  </div>
</template>
