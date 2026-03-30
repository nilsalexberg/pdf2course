<script setup lang="ts">
import type { CourseWithSignedCover, ModuleWithLessons } from '@@/types/course'

definePageMeta({ middleware: ['auth', 'role'] })
useHead({ title: 'Course Detail · Admin · pdf2course' })

const route = useRoute()
const id = route.params.id as string

const { data: course, pending: coursePending, error: courseError, refresh: refreshCourse } = await useFetch<CourseWithSignedCover>(`/api/admin/courses/${id}`)
const { data: modules, pending: modulesPending } = useFetch<ModuleWithLessons[]>(`/api/admin/courses/${id}/structure`, { default: () => [] })

const rejectingId = ref<string | null>(null)
const rejectReason = ref('')
const actionError = ref<string | null>(null)

async function approve() {
  actionError.value = null
  try {
    await $fetch(`/api/admin/courses/${id}/approve`, { method: 'POST' })
    await refreshCourse()
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || 'Failed to approve course'
  }
}

function openReject() {
  rejectingId.value = id
  rejectReason.value = ''
  actionError.value = null
}

async function confirmReject() {
  actionError.value = null
  try {
    await $fetch(`/api/admin/courses/${id}/reject`, {
      method: 'POST',
      body: { reason: rejectReason.value },
    })
    rejectingId.value = null
    rejectReason.value = ''
    await refreshCourse()
  } catch (err: any) {
    actionError.value = err.data?.statusMessage || 'Failed to reject course'
  }
}

const statusClass: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-300',
  pending_review: 'bg-amber-900/50 text-amber-200',
  approved: 'bg-emerald-900/50 text-emerald-200',
  rejected: 'bg-red-900/50 text-red-200',
}

</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-6">
        <NuxtLink to="/admin" class="text-sm text-slate-400 hover:text-slate-300 transition-colors">
          ← Back to admin
        </NuxtLink>
      </div>

      <div v-if="coursePending" class="flex justify-center py-16">
        <UiSpinner class="w-8 h-8 text-emerald-500" />
      </div>

      <div v-else-if="courseError" class="text-sm text-red-400">
        {{ courseError.message }}
      </div>

      <template v-else-if="course">
        <!-- Course header -->
        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden mb-6">
          <div class="flex gap-6 p-6">
            <div v-if="course.cover_url_signed" class="w-32 shrink-0 rounded-xl overflow-hidden bg-slate-800">
              <img :src="course.cover_url_signed" :alt="course.title" class="w-full aspect-square object-cover">
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <h1 class="text-2xl font-semibold text-white leading-tight">
                  {{ course.title }}
                </h1>
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize shrink-0"
                  :class="statusClass[course.status]"
                >
                  {{ course.status.replace('_', ' ') }}
                </span>
              </div>
              <p v-if="course.description" class="text-slate-400 mt-2">
                {{ course.description }}
              </p>
              <p class="text-xs text-slate-500 mt-3">
                Created {{ new Date(course.created_at).toLocaleDateString() }}
              </p>
              <div
                v-if="course.status === 'rejected' && course.rejection_reason"
                class="mt-3 rounded-lg bg-red-950/50 border border-red-900/40 px-3 py-2"
              >
                <p class="text-xs font-medium text-red-400 mb-0.5">Rejection reason</p>
                <p class="text-sm text-red-200">{{ course.rejection_reason }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="course.status !== 'draft'" class="border-t border-slate-800 px-6 py-4 flex items-center gap-3">
            <p v-if="actionError" class="text-sm text-red-400 flex-1">
              {{ actionError }}
            </p>
            <template v-if="course.status === 'pending_review'">
              <UiButton :block="false" @click="approve">
                Approve
              </UiButton>
              <UiButton variant="ghost" :block="false" class="text-red-400 hover:text-red-300 hover:bg-red-950/20" @click="openReject">
                Reject
              </UiButton>
            </template>
            <template v-else-if="course.status === 'approved'">
              <UiButton variant="ghost" :block="false" @click="openReject">
                Revoke approval
              </UiButton>
            </template>
            <template v-else-if="course.status === 'rejected'">
              <UiButton :block="false" @click="approve">
                Approve anyway
              </UiButton>
            </template>
          </div>
        </div>

        <!-- Source PDFs -->
        <section class="mb-6">
          <h2 class="text-lg font-semibold text-slate-300 mb-3">
            Source PDFs
          </h2>
          <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <CoursesSourcePdfs :course-id="id" readonly />
          </div>
        </section>

        <!-- Generated structure -->
        <section>
          <h2 class="text-lg font-semibold text-slate-300 mb-3">
            Generated structure
          </h2>

          <div v-if="modulesPending" class="flex justify-center py-8">
            <UiSpinner class="w-6 h-6 text-emerald-500" />
          </div>

          <div
            v-else-if="!modules?.length"
            class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center text-slate-400 text-sm"
          >
            No structure generated yet.
          </div>

          <CoursesStructureList v-else :modules="modules" :course-id="id" :readonly="true" />
        </section>
      </template>
    </div>

    <!-- Reject modal -->
    <div
      v-if="rejectingId"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      @click.self="rejectingId = null"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-white mb-4">
          Reject course
        </h3>
        <UiTextarea
          v-model="rejectReason"
          placeholder="Explain why this course is being rejected..."
          class="mb-4"
          :rows="4"
        />
        <p v-if="actionError" class="text-sm text-red-400 mb-3">
          {{ actionError }}
        </p>
        <div class="flex gap-3 justify-end">
          <UiButton variant="secondary" :block="false" @click="rejectingId = null">
            Cancel
          </UiButton>
          <UiButton
            variant="danger"
            :block="false"
            :disabled="!rejectReason.trim()"
            @click="confirmReject"
          >
            Reject
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
