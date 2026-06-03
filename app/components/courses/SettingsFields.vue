<script setup lang="ts">
  import {
    COURSE_LANGUAGE_LEVELS,
    COURSE_FOCUS_OPTIONS,
    COURSE_LANGUAGES,
    COURSE_TONES,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_OVERLAP,
    CHUNK_SIZE_LIMITS,
    CHUNK_OVERLAP_LIMITS
  } from '@@/types/courseConfig';

  defineProps<{ readonly?: boolean }>();

  const numModules = defineModel<number>('numModules', { required: true });
  const lessonsPerModule = defineModel<number>('lessonsPerModule', { required: true });
  const languageLevel = defineModel<string>('languageLevel', { required: true });
  const focus = defineModel<string>('focus', { required: true });
  const language = defineModel<string>('language', { required: true });
  const tone = defineModel<string>('tone', { required: true });
  const chunkSize = defineModel<number>('chunkSize', { default: DEFAULT_CHUNK_SIZE });
  const chunkOverlap = defineModel<number>('chunkOverlap', { default: DEFAULT_CHUNK_OVERLAP });
</script>

<template>
  <div v-if="readonly">
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div
        v-for="item in [
          { label: 'Number of modules', value: numModules },
          { label: 'Lessons per module', value: lessonsPerModule },
          { label: 'Language level', value: languageLevel },
          { label: 'Educational focus', value: focus },
          { label: 'Target language', value: language },
          { label: 'Course tone', value: tone }
        ]"
        :key="item.label"
      >
        <p class="text-xs font-medium text-slate-400 mb-1">{{ item.label }}</p>
        <p class="text-sm text-slate-100">{{ item.value }}</p>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-slate-700">
      <p class="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Advanced</p>
      <div class="grid grid-cols-2 gap-4">
        <div
          v-for="item in [
            { label: 'Chunk size', value: chunkSize ?? DEFAULT_CHUNK_SIZE },
            { label: 'Chunk overlap', value: chunkOverlap ?? DEFAULT_CHUNK_OVERLAP }
          ]"
          :key="item.label"
        >
          <p class="text-xs font-medium text-slate-400 mb-1">{{ item.label }}</p>
          <p class="text-sm text-slate-100">{{ item.value }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else>
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
      <UiSelect id="tone" v-model="tone" label="Course tone" :options="COURSE_TONES" required />
    </div>

    <div class="mt-4 pt-4 border-t border-slate-700">
      <UiCollapsible label="Advanced settings">
        <div class="space-y-4">
          <UiAlert type="info">
            <p class="space-y-1.5 text-xs">
              <span class="block">
                <span class="text-blue-200 font-medium">Chunk size</span> controls how many
                characters each text segment contains before being sent for AI processing. Increase
                it for dense, technical documents where more context per chunk improves
                understanding. Decrease it for shorter, self-contained paragraphs or when you want
                more granular retrieval.
              </span>
              <span class="block">
                <span class="text-blue-200 font-medium">Chunk overlap</span> is the number of
                characters shared between consecutive chunks to preserve context across boundaries.
                Increase it if key ideas tend to span paragraph breaks. Decrease it (or set to 0) to
                reduce redundancy and lower processing cost.
              </span>
            </p>
          </UiAlert>

          <div class="grid grid-cols-2 gap-4">
            <UiInput
              id="chunk_size"
              v-model.number="chunkSize"
              type="number"
              label="Chunk size (chars)"
              :min="CHUNK_SIZE_LIMITS.min"
              :max="CHUNK_SIZE_LIMITS.max"
              :placeholder="String(DEFAULT_CHUNK_SIZE)"
            />
            <UiInput
              id="chunk_overlap"
              v-model.number="chunkOverlap"
              type="number"
              label="Chunk overlap (chars)"
              :min="CHUNK_OVERLAP_LIMITS.min"
              :max="CHUNK_OVERLAP_LIMITS.max"
              :placeholder="String(DEFAULT_CHUNK_OVERLAP)"
            />
          </div>
        </div>
      </UiCollapsible>
    </div>
  </div>
</template>
