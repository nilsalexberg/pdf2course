<script setup lang="ts">
defineProps<{
  coverUrlSigned?: string | null
}>()

const title = defineModel<string>('title', { required: true })
const description = defineModel<string>('description', { required: true })

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
</template>
