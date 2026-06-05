<script setup lang="ts">
  import type { CourseWithSignedCover } from '@@/types/course';

  const props = withDefaults(
    defineProps<{
      course: CourseWithSignedCover;
      highlighted?: boolean;
      coverSize?: 'sm' | 'md' | 'lg';
      titleTo?: string;
    }>(),
    {
      highlighted: false,
      coverSize: 'md'
    }
  );

  const coverClass = computed(() => ({ sm: 'w-20', md: 'w-24', lg: 'w-32' })[props.coverSize]);
</script>

<template>
  <li
    class="rounded-2xl border bg-slate-900/80 overflow-hidden flex gap-4"
    :class="highlighted ? 'border-amber-800/40' : 'border-slate-800'"
  >
    <div v-if="course.coverUrlSigned" :class="`${coverClass} shrink-0 bg-slate-800`">
      <img
        :src="course.coverUrlSigned"
        :alt="course.title"
        class="w-full h-full aspect-square object-cover"
      />
    </div>
    <div class="flex-1 min-w-0 py-4">
      <NuxtLink
        v-if="titleTo"
        :to="titleTo"
        class="font-semibold text-white truncate block hover:text-emerald-300 transition-colors"
      >
        {{ course.title }}
      </NuxtLink>
      <div v-else class="font-semibold text-white truncate">
        {{ course.title }}
      </div>
      <p v-if="course.description" class="text-sm text-slate-400 line-clamp-2 mt-0.5">
        {{ course.description }}
      </p>
      <div v-if="$slots.meta" class="mt-1">
        <slot name="meta" />
      </div>
    </div>
    <div v-if="$slots.actions" class="shrink-0 flex items-center pr-4 gap-3">
      <slot name="actions" />
    </div>
  </li>
</template>
