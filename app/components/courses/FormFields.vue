<script setup lang="ts">
import { COURSE_LANGUAGE_LEVELS, COURSE_FOCUS_OPTIONS, COURSE_LANGUAGES, COURSE_TONES } from '@@/types/courseConfig'

defineProps<{
  coverUrlSigned?: string | null
}>()

const title = defineModel<string>('title', { required: true })
const description = defineModel<string>('description', { required: true })
const numModules = defineModel<number>('numModules', { required: true })
const lessonsPerModule = defineModel<number>('lessonsPerModule', { required: true })
const languageLevel = defineModel<string>('languageLevel', { required: true })
const focus = defineModel<string>('focus', { required: true })
const language = defineModel<string>('language', { required: true })
const tone = defineModel<string>('tone', { required: true })

const emit = defineEmits<{
  coverChange: [e: Event]
}>()
</script>

<template>
  <UiInput
    id="title"
    v-model="title"
    type="text"
    label="Title"
    placeholder="Course title"
    required
  />

  <UiTextarea
    id="description"
    v-model="description"
    label="Description"
    placeholder="Optional short description"
    :rows="3"
  />

  <div v-if="coverUrlSigned" class="mb-2">
    <p class="text-sm text-slate-400 mb-2">Current cover:</p>
    <img :src="coverUrlSigned" class="w-full h-32 object-cover rounded-lg border border-slate-800" />
  </div>

  <UiFileInput
    :label="coverUrlSigned ? 'Change cover image' : 'Cover image'"
    accept="image/jpeg,image/png,image/webp"
    :help="coverUrlSigned ? 'Optional. JPEG, PNG or WebP, max 5MB. Leave empty to keep current.' : 'Optional. JPEG, PNG or WebP, max 5MB.'"
    @change="emit('coverChange', $event)"
  />

  <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    <UiInput
      id="num_modules"
      v-model.number="numModules"
      type="number"
      label="Number of modules"
      required
      :min="1"
      :max="50"
    />
    <UiInput
      id="lessons_per_module"
      v-model.number="lessonsPerModule"
      type="number"
      label="Lessons per module"
      required
      :min="1"
      :max="20"
    />
    <UiSelect
      id="language_level"
      v-model="languageLevel"
      label="Language level"
      :options="COURSE_LANGUAGE_LEVELS"
      required
    />
    <UiSelect
      id="focus"
      v-model="focus"
      label="Educational focus"
      :options="COURSE_FOCUS_OPTIONS"
      required
    />
    <UiSelect
      id="language"
      v-model="language"
      label="Target language"
      :options="COURSE_LANGUAGES"
      required
    />
    <UiSelect
      id="tone"
      v-model="tone"
      label="Course tone"
      :options="COURSE_TONES"
      required
    />
  </div>
</template>
