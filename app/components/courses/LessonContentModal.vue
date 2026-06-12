<script setup lang="ts">
  import { FetchError } from 'ofetch';
  import type { Lesson, LessonContent, LessonStep } from '@@/types/course';

  const props = defineProps<{
    lesson: Lesson;
    readonly?: boolean;
  }>();

  const emit = defineEmits<{
    close: [];
    'update:lesson': [lesson: Lesson];
  }>();

  // ─── Local editable copy ──────────────────────────────────────────────────────

  function cloneContent(c: LessonContent): LessonContent {
    return JSON.parse(JSON.stringify(c));
  }

  const editing = ref(false);
  const saving = ref(false);
  const saveError = ref<string | null>(null);
  const draft = ref<LessonContent | null>(null);

  function startEdit() {
    draft.value = cloneContent(props.lesson.content!);
    editing.value = true;
    saveError.value = null;
  }

  function cancelEdit() {
    editing.value = false;
    draft.value = null;
    saveError.value = null;
  }

  async function saveEdit() {
    if (!draft.value) return;
    saving.value = true;
    saveError.value = null;
    try {
      const updated = await $fetch<Lesson>(
        `/api/courses/${props.lesson.courseId}/lessons/${props.lesson.id}/content`,
        { method: 'PATCH', body: draft.value }
      );
      emit('update:lesson', updated);
      editing.value = false;
      draft.value = null;
    } catch (err) {
      if (err instanceof FetchError) {
        saveError.value = err.data?.statusMessage || err.message || 'Failed to save';
      }
    } finally {
      saving.value = false;
    }
  }

  // ─── Step helpers ─────────────────────────────────────────────────────────────

  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  function stepLabel(step: LessonStep): string {
    if (step.type === 'section') return 'Section';
    if (step.type === 'multiple_choice') return 'Multiple Choice';
    if (step.type === 'true_false') return 'True / False';
    return 'Fill in the Blank';
  }

  function ensureOptions(step: LessonStep) {
    if (step.type !== 'multiple_choice') return;
    while (step.options.length < 4) step.options.push('');
  }

  const display = computed(() => (editing.value ? draft.value : props.lesson.content));
</script>

<template>
  <div
    class="fixed inset-0 bg-black/75 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-0.5">
            Lesson {{ lesson.lessonNumber }}
          </p>
          <h2 class="text-lg font-semibold text-white leading-snug">
            {{ lesson.title }}
          </h2>
        </div>
        <div class="flex items-center gap-2 shrink-0 pt-1">
          <UiButton
            v-if="!readonly && !editing"
            variant="secondary"
            size="xs"
            :block="false"
            class="gap-1.5"
            @click="startEdit"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </UiButton>
          <button
            class="rounded-lg p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            @click="$emit('close')"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div v-if="display" class="p-6 space-y-6">
        <!-- Introduction -->
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Introduction</p>
          <template v-if="editing && draft">
            <textarea
              v-model="draft.introduction"
              rows="4"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none resize-y"
            />
          </template>
          <p v-else class="text-sm text-slate-300 leading-relaxed">
            {{ display!.introduction }}
          </p>
        </div>

        <!-- Steps -->
        <div class="space-y-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Steps ({{ display!.steps.length }})
          </p>

          <div
            v-for="(step, i) in editing && draft ? draft.steps : display!.steps"
            :key="i"
            class="rounded-xl border border-slate-800 bg-slate-800/30 p-4 space-y-3"
          >
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {{ stepLabel(step) }}
            </p>

            <!-- Section -->
            <template v-if="step.type === 'section'">
              <template v-if="editing">
                <input
                  v-model="step.title"
                  type="text"
                  placeholder="Section title"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                />
                <textarea
                  v-model="step.content"
                  rows="3"
                  placeholder="Section content"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none resize-y"
                />
              </template>
              <template v-else>
                <p class="text-sm font-semibold text-white">{{ step.title }}</p>
                <p class="text-sm text-slate-300 leading-relaxed">{{ step.content }}</p>
              </template>
            </template>

            <!-- Multiple Choice -->
            <template v-else-if="step.type === 'multiple_choice'">
              <template v-if="editing">
                <input
                  v-model="step.question"
                  type="text"
                  placeholder="Question"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                  @focus="ensureOptions(step)"
                />
                <div class="space-y-2">
                  <div v-for="(_, oi) in step.options" :key="oi" class="flex items-center gap-2">
                    <button
                      type="button"
                      class="w-7 h-7 rounded-full border text-xs font-bold shrink-0 transition-colors"
                      :class="
                        step.correctIndex === oi
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-600'
                      "
                      :title="step.correctIndex === oi ? 'Correct answer' : 'Set as correct'"
                      @click="step.correctIndex = oi"
                    >
                      {{ OPTION_LABELS[oi] }}
                    </button>
                    <input
                      v-model="step.options[oi]"
                      type="text"
                      :placeholder="`Option ${OPTION_LABELS[oi]}`"
                      class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  v-model="step.explanation"
                  type="text"
                  placeholder="Explanation (shown after answering)"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                />
              </template>
              <template v-else>
                <p class="text-sm font-medium text-slate-100">{{ step.question }}</p>
                <ul class="space-y-1">
                  <li
                    v-for="(opt, oi) in step.options"
                    :key="oi"
                    class="text-sm flex items-center gap-2"
                    :class="
                      step.correctIndex === oi ? 'text-emerald-400 font-medium' : 'text-slate-400'
                    "
                  >
                    <span class="font-semibold w-4 shrink-0">{{ OPTION_LABELS[oi] }}.</span>
                    {{ opt }}
                    <svg
                      v-if="step.correctIndex === oi"
                      class="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                  </li>
                </ul>
                <p class="text-xs text-slate-500 italic">{{ step.explanation }}</p>
              </template>
            </template>

            <!-- True / False -->
            <template v-else-if="step.type === 'true_false'">
              <template v-if="editing">
                <input
                  v-model="step.statement"
                  type="text"
                  placeholder="Statement"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                />
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="
                      step.isTrue
                        ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-600'
                    "
                    @click="step.isTrue = true"
                  >
                    True
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="
                      !step.isTrue
                        ? 'bg-red-900/40 border-red-600 text-red-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-red-600'
                    "
                    @click="step.isTrue = false"
                  >
                    False
                  </button>
                </div>
                <input
                  v-model="step.explanation"
                  type="text"
                  placeholder="Explanation"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                />
              </template>
              <template v-else>
                <p class="text-sm text-slate-100">{{ step.statement }}</p>
                <span
                  class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="
                    step.isTrue
                      ? 'bg-emerald-900/40 text-emerald-300'
                      : 'bg-red-900/40 text-red-300'
                  "
                >
                  {{ step.isTrue ? 'True' : 'False' }}
                </span>
                <p class="text-xs text-slate-500 italic">{{ step.explanation }}</p>
              </template>
            </template>

            <!-- Fill in the Blank -->
            <template v-else-if="step.type === 'fill_blank'">
              <template v-if="editing">
                <input
                  v-model="step.sentence"
                  type="text"
                  placeholder="Sentence with ___ for the blank"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                />
                <input
                  v-model="step.answer"
                  type="text"
                  placeholder="Answer"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                />
                <input
                  v-model="step.explanation"
                  type="text"
                  placeholder="Explanation"
                  class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                />
              </template>
              <template v-else>
                <p class="text-sm text-slate-100 font-medium">
                  {{ step.sentence.replace('___', '________') }}
                </p>
                <p class="text-xs text-emerald-400">
                  Answer: <span class="font-semibold">{{ step.answer }}</span>
                </p>
                <p class="text-xs text-slate-500 italic">{{ step.explanation }}</p>
              </template>
            </template>
          </div>
        </div>

        <!-- Summary -->
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</p>
          <template v-if="editing && draft">
            <textarea
              v-model="draft.summary"
              rows="3"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none resize-y"
            />
          </template>
          <p v-else class="text-sm text-slate-300 leading-relaxed">
            {{ display!.summary }}
          </p>
        </div>

        <!-- Edit actions -->
        <div v-if="editing" class="pt-2 flex items-center gap-3">
          <UiButton :block="false" :loading="saving" @click="saveEdit">
            {{ saving ? 'Saving…' : 'Save changes' }}
          </UiButton>
          <UiButton variant="secondary" :block="false" :disabled="saving" @click="cancelEdit">
            Cancel
          </UiButton>
          <p v-if="saveError" class="text-xs text-red-400 flex-1">
            {{ saveError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
