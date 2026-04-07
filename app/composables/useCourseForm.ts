import { COURSE_LANGUAGE_LEVELS, COURSE_FOCUS_OPTIONS, COURSE_LANGUAGES, COURSE_TONES, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from '@@/types/courseConfig'
import type { CourseWithSignedCover } from '@@/types/course'

const COVER_MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function useCourseForm() {
  const title = ref('')
  const description = ref('')
  const numModules = ref(5)
  const lessonsPerModule = ref(4)
  const languageLevel = ref<string>(COURSE_LANGUAGE_LEVELS[0])
  const focus = ref<string>(COURSE_FOCUS_OPTIONS[0])
  const language = ref<string>(COURSE_LANGUAGES[0])
  const tone = ref<string>(COURSE_TONES[0])
  const chunkSize = ref<number>(DEFAULT_CHUNK_SIZE)
  const chunkOverlap = ref<number>(DEFAULT_CHUNK_OVERLAP)
  const coverFile = ref<File | null>(null)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  function onCoverChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) {
      coverFile.value = null
      return
    }
    if (!file.type.startsWith('image/')) {
      errorMessage.value = 'Please choose a JPEG, PNG or WebP image.'
      coverFile.value = null
      input.value = ''
      return
    }
    if (file.size > COVER_MAX_SIZE) {
      errorMessage.value = 'Cover image must be at most 5MB.'
      coverFile.value = null
      input.value = ''
      return
    }
    errorMessage.value = null
    coverFile.value = file
  }

  function fillForm(course: CourseWithSignedCover) {
    title.value = course.title
    description.value = course.description || ''
    numModules.value = course.config?.num_modules ?? 5
    lessonsPerModule.value = course.config?.lessons_per_module ?? 4
    languageLevel.value = course.config?.language_level ?? COURSE_LANGUAGE_LEVELS[0]
    focus.value = course.config?.focus ?? COURSE_FOCUS_OPTIONS[0]
    language.value = course.config?.language ?? COURSE_LANGUAGES[0]
    tone.value = course.config?.tone ?? COURSE_TONES[0]
    chunkSize.value = course.config?.chunk_size ?? DEFAULT_CHUNK_SIZE
    chunkOverlap.value = course.config?.chunk_overlap ?? DEFAULT_CHUNK_OVERLAP
  }

  function buildFormData(extra?: (fd: FormData) => void): FormData {
    const fd = new FormData()
    fd.set('title', title.value.trim())
    fd.set('description', description.value.trim())
    fd.set('num_modules', String(numModules.value))
    fd.set('lessons_per_module', String(lessonsPerModule.value))
    fd.set('language_level', languageLevel.value)
    fd.set('focus', focus.value)
    fd.set('language', language.value)
    fd.set('tone', tone.value)
    if (chunkSize.value != null) fd.set('chunk_size', String(chunkSize.value))
    if (chunkOverlap.value != null) fd.set('chunk_overlap', String(chunkOverlap.value))
    if (coverFile.value) fd.set('cover', coverFile.value)
    extra?.(fd)
    return fd
  }

  return {
    title, description, numModules, lessonsPerModule,
    languageLevel, focus, language, tone,
    chunkSize, chunkOverlap,
    coverFile, loading, errorMessage,
    onCoverChange, fillForm, buildFormData,
  }
}
