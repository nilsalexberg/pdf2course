<script setup lang="ts">
import type { ModuleWithLessons, Module, Lesson } from '@@/types/course'

const props = defineProps<{
  modules: ModuleWithLessons[]
  courseId: string
  readonly?: boolean
}>()

const localModules = ref<ModuleWithLessons[]>(props.modules ?? [])
watch(() => props.modules, (val) => { localModules.value = val ?? [] }, { immediate: true })

// ─── Expand/collapse ──────────────────────────────────────────────────────────

const expandedModules = ref<Set<string>>(new Set())

function toggleModule(moduleId: string) {
  if (expandedModules.value.has(moduleId)) {
    expandedModules.value.delete(moduleId)
  } else {
    expandedModules.value.add(moduleId)
  }
}

// ─── Module editing ───────────────────────────────────────────────────────────

const editingModuleId = ref<string | null>(null)
const moduleForm = ref({ title: '', description: '' })
const moduleSaving = ref(false)
const moduleError = ref<string | null>(null)

function startEditModule(mod: Module) {
  editingModuleId.value = mod.id
  moduleForm.value = { title: mod.title, description: mod.description }
  moduleError.value = null
}

function cancelEditModule() {
  editingModuleId.value = null
  moduleError.value = null
}

async function saveModule(mod: Module) {
  moduleError.value = null
  moduleSaving.value = true
  try {
    const updated = await $fetch<Module>(`/api/courses/${props.courseId}/modules/${mod.id}`, {
      method: 'PATCH',
      body: moduleForm.value,
    })
    const idx = localModules.value.findIndex(m => m.id === mod.id)
    if (idx !== -1) {
      localModules.value[idx] = { ...localModules.value[idx], ...updated } as ModuleWithLessons
    }
    editingModuleId.value = null
  } catch (err: any) {
    moduleError.value = err?.data?.message ?? err?.message ?? 'Failed to save module.'
  } finally {
    moduleSaving.value = false
  }
}

// ─── Lesson editing ───────────────────────────────────────────────────────────

const editingLessonId = ref<string | null>(null)
const lessonForm = ref({
  title: '',
  description: '',
  learning_objectives: '',
  key_topics: '',
})
const lessonSaving = ref(false)
const lessonError = ref<string | null>(null)

function startEditLesson(lesson: Lesson) {
  editingLessonId.value = lesson.id
  lessonForm.value = {
    title: lesson.title,
    description: lesson.description,
    learning_objectives: lesson.learning_objectives.join('\n'),
    key_topics: lesson.key_topics.join('\n'),
  }
  lessonError.value = null
}

function cancelEditLesson() {
  editingLessonId.value = null
  lessonError.value = null
}

async function saveLesson(lesson: Lesson) {
  lessonError.value = null
  lessonSaving.value = true
  try {
    const body = {
      title: lessonForm.value.title,
      description: lessonForm.value.description,
      learning_objectives: lessonForm.value.learning_objectives.split('\n').map(s => s.trim()).filter(Boolean),
      key_topics: lessonForm.value.key_topics.split('\n').map(s => s.trim()).filter(Boolean),
    }
    const updated = await $fetch<Lesson>(`/api/courses/${props.courseId}/lessons/${lesson.id}`, {
      method: 'PATCH',
      body,
    })
    const mod = localModules.value.find(m => m.id === lesson.module_id)
    if (mod) {
      const idx = mod.lessons.findIndex(l => l.id === lesson.id)
      if (idx !== -1) mod.lessons[idx] = updated
    }
    editingLessonId.value = null
  } catch (err: any) {
    lessonError.value = err?.data?.message ?? err?.message ?? 'Failed to save lesson.'
  } finally {
    lessonSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="mod in localModules"
      :key="mod.id"
      class="rounded-xl border border-slate-700/60 overflow-hidden"
    >
      <!-- Module header -->
      <div class="bg-slate-800/50 px-5 py-4">
        <!-- Edit form -->
        <div v-if="!readonly && editingModuleId === mod.id" class="space-y-3">
          <UiInput v-model="moduleForm.title" label="Module title" />
          <UiTextarea v-model="moduleForm.description" label="Description" :rows="3" />
          <p v-if="moduleError" class="text-xs text-red-400">{{ moduleError }}</p>
          <div class="flex gap-2">
            <UiButton type="button" :block="false" :loading="moduleSaving" @click="saveModule(mod)">
              {{ moduleSaving ? 'Saving…' : 'Save' }}
            </UiButton>
            <UiButton type="button" variant="secondary" :block="false" :disabled="moduleSaving" @click="cancelEditModule">
              Cancel
            </UiButton>
          </div>
        </div>

        <!-- View mode -->
        <div v-else class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-0.5">
              Module {{ mod.module_number }}
            </p>
            <p class="text-sm font-semibold text-white">{{ mod.title }}</p>
            <p class="text-xs text-slate-400 mt-0.5 line-clamp-1">{{ mod.description }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="!readonly"
              class="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
              @click="startEditModule(mod)"
            >
              Edit
            </button>
            <button
              class="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
              @click="toggleModule(mod.id)"
            >
              {{ expandedModules.has(mod.id) ? '↑' : `${mod.lessons.length} lessons ↓` }}
            </button>
          </div>
        </div>
      </div>

      <!-- Lessons list -->
      <div v-if="expandedModules.has(mod.id)" class="divide-y divide-slate-800/60">
        <div
          v-for="lesson in mod.lessons"
          :key="lesson.id"
          class="px-5 py-4"
        >
          <!-- Edit form -->
          <div v-if="!readonly && editingLessonId === lesson.id" class="space-y-3">
            <UiInput v-model="lessonForm.title" label="Lesson title" />
            <UiTextarea v-model="lessonForm.description" label="Description" :rows="2" />
            <UiTextarea v-model="lessonForm.learning_objectives" label="Learning objectives (one per line)" :rows="4" />
            <UiTextarea v-model="lessonForm.key_topics" label="Key topics (one per line)" :rows="3" />
            <p v-if="lessonError" class="text-xs text-red-400">{{ lessonError }}</p>
            <div class="flex gap-2">
              <UiButton type="button" :block="false" :loading="lessonSaving" @click="saveLesson(lesson)">
                {{ lessonSaving ? 'Saving…' : 'Save' }}
              </UiButton>
              <UiButton type="button" variant="secondary" :block="false" :disabled="lessonSaving" @click="cancelEditLesson">
                Cancel
              </UiButton>
            </div>
          </div>

          <!-- View mode -->
          <div v-else class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-slate-500">Lesson {{ lesson.lesson_number }}</span>
              </div>
              <p class="text-sm font-medium text-white">{{ lesson.title }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ lesson.description }}</p>
              <div v-if="lesson.learning_objectives.length" class="mt-2 space-y-1">
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Objectives</p>
                <ul class="space-y-0.5">
                  <li
                    v-for="(obj, i) in lesson.learning_objectives"
                    :key="i"
                    class="text-xs text-slate-400 flex gap-1.5"
                  >
                    <span class="text-emerald-500 shrink-0">·</span>
                    <span>{{ obj }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="lesson.key_topics.length" class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="(topic, i) in lesson.key_topics"
                  :key="i"
                  class="text-xs bg-slate-800 text-slate-300 rounded px-2 py-0.5"
                >
                  {{ topic }}
                </span>
              </div>
            </div>
            <button
              v-if="!readonly"
              class="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-700/50 shrink-0"
              @click="startEditLesson(lesson)"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
