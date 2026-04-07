<script setup lang="ts">
import { COURSE_LANGUAGE_LEVELS, COURSE_FOCUS_OPTIONS, COURSE_LANGUAGES, COURSE_TONES } from '@@/types/courseConfig'

defineProps<{ readonly?: boolean }>()

const numModules = defineModel<number>('numModules', { required: true })
const lessonsPerModule = defineModel<number>('lessonsPerModule', { required: true })
const languageLevel = defineModel<string>('languageLevel', { required: true })
const focus = defineModel<string>('focus', { required: true })
const language = defineModel<string>('language', { required: true })
const tone = defineModel<string>('tone', { required: true })
</script>

<template>
  <div v-if="readonly" class="grid grid-cols-2 md:grid-cols-3 gap-4">
    <div v-for="item in [
      { label: 'Number of modules', value: numModules },
      { label: 'Lessons per module', value: lessonsPerModule },
      { label: 'Language level', value: languageLevel },
      { label: 'Educational focus', value: focus },
      { label: 'Target language', value: language },
      { label: 'Course tone', value: tone },
    ]" :key="item.label">
      <p class="text-xs font-medium text-slate-400 mb-1">{{ item.label }}</p>
      <p class="text-sm text-slate-100">{{ item.value }}</p>
    </div>
  </div>

  <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
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
