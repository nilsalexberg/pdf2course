<script setup lang="ts">
  import type { Exercise } from '@@/types/course';

  const props = defineProps<{
    exercise: Exercise;
    index: number;
  }>();

  const emit = defineEmits<{
    answered: [isCorrect: boolean];
  }>();

  const isSubmitted = ref(false);
  const isCorrect = ref(false);

  // Multiple choice
  const selectedOption = ref<number | null>(null);

  // True/False
  const selectedBool = ref<boolean | null>(null);

  // Fill blank
  const userInput = ref('');

  function submitMultipleChoice(optionIndex: number) {
    if (isSubmitted.value) return;
    selectedOption.value = optionIndex;
    if (props.exercise.type !== 'multiple_choice') return;
    isCorrect.value = optionIndex === props.exercise.correct_index;
    isSubmitted.value = true;
    emit('answered', isCorrect.value);
  }

  function submitTrueFalse(answer: boolean) {
    if (isSubmitted.value) return;
    selectedBool.value = answer;
    if (props.exercise.type !== 'true_false') return;
    isCorrect.value = answer === props.exercise.is_true;
    isSubmitted.value = true;
    emit('answered', isCorrect.value);
  }

  function submitFillBlank() {
    if (isSubmitted.value || !userInput.value.trim()) return;
    if (props.exercise.type !== 'fill_blank') return;
    isCorrect.value = userInput.value.trim().toLowerCase() === props.exercise.answer.toLowerCase();
    isSubmitted.value = true;
    emit('answered', isCorrect.value);
  }
</script>

<template>
  <div
    class="rounded-xl border bg-slate-900 p-5 space-y-4"
    :class="
      isSubmitted ? (isCorrect ? 'border-emerald-700/50' : 'border-red-700/50') : 'border-slate-800'
    "
  >
    <!-- Exercise number -->
    <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
      Exercise {{ index + 1 }}
    </p>

    <!-- ─── Multiple Choice ─── -->
    <template v-if="exercise.type === 'multiple_choice'">
      <p class="text-sm font-medium text-slate-100">{{ exercise.question }}</p>
      <div class="space-y-2">
        <button
          v-for="(option, i) in exercise.options"
          :key="i"
          class="w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors"
          :class="{
            'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/50':
              !isSubmitted && selectedOption !== i,
            'border-emerald-500 bg-emerald-900/30 text-emerald-300':
              isSubmitted && i === exercise.correct_index,
            'border-red-500 bg-red-900/30 text-red-300':
              isSubmitted && selectedOption === i && i !== exercise.correct_index,
            'border-slate-700 text-slate-500':
              isSubmitted && i !== exercise.correct_index && selectedOption !== i
          }"
          :disabled="isSubmitted"
          @click="submitMultipleChoice(i)"
        >
          <span class="font-semibold mr-2 text-slate-400">{{ ['A', 'B', 'C', 'D'][i] }}.</span>
          {{ option }}
        </button>
      </div>
    </template>

    <!-- ─── True / False ─── -->
    <template v-else-if="exercise.type === 'true_false'">
      <p class="text-sm font-medium text-slate-100">{{ exercise.statement }}</p>
      <div class="flex gap-3">
        <button
          class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
          :class="{
            'border-slate-700 text-slate-300 hover:border-emerald-600 hover:bg-emerald-900/20 hover:text-emerald-300':
              !isSubmitted,
            'border-emerald-500 bg-emerald-900/30 text-emerald-300':
              isSubmitted && exercise.is_true,
            'border-red-500 bg-red-900/30 text-red-300':
              isSubmitted && selectedBool === true && !exercise.is_true,
            'border-slate-700 text-slate-500':
              isSubmitted && selectedBool !== true && !exercise.is_true
          }"
          :disabled="isSubmitted"
          @click="submitTrueFalse(true)"
        >
          True
        </button>
        <button
          class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
          :class="{
            'border-slate-700 text-slate-300 hover:border-red-600 hover:bg-red-900/20 hover:text-red-300':
              !isSubmitted,
            'border-emerald-500 bg-emerald-900/30 text-emerald-300':
              isSubmitted && !exercise.is_true,
            'border-red-500 bg-red-900/30 text-red-300':
              isSubmitted && selectedBool === false && exercise.is_true,
            'border-slate-700 text-slate-500':
              isSubmitted && selectedBool !== false && exercise.is_true
          }"
          :disabled="isSubmitted"
          @click="submitTrueFalse(false)"
        >
          False
        </button>
      </div>
    </template>

    <!-- ─── Fill in the Blank ─── -->
    <template v-else-if="exercise.type === 'fill_blank'">
      <p class="text-sm font-medium text-slate-100">
        {{ exercise.sentence.replace('___', '________') }}
      </p>
      <div class="flex gap-2">
        <input
          v-model="userInput"
          type="text"
          placeholder="Your answer…"
          class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none disabled:opacity-50"
          :disabled="isSubmitted"
          @keydown.enter="submitFillBlank"
        />
        <button
          class="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSubmitted || !userInput.trim()"
          @click="submitFillBlank"
        >
          Check
        </button>
      </div>
      <p v-if="isSubmitted && !isCorrect" class="text-xs text-slate-400">
        Correct answer: <span class="text-emerald-400 font-medium">{{ exercise.answer }}</span>
      </p>
    </template>

    <!-- ─── Feedback ─── -->
    <div
      v-if="isSubmitted"
      class="rounded-lg px-4 py-3 text-sm"
      :class="
        isCorrect
          ? 'bg-emerald-900/20 border border-emerald-800/40 text-emerald-300'
          : 'bg-red-900/20 border border-red-800/40 text-red-300'
      "
    >
      <div class="flex items-start gap-2">
        <svg
          v-if="isCorrect"
          class="w-4 h-4 mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
        </svg>
        <svg
          v-else
          class="w-4 h-4 mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>{{ isCorrect ? 'Correct! ' : 'Not quite. ' }}{{ exercise.explanation }}</span>
      </div>
    </div>
  </div>
</template>
