<script setup lang="ts">
const user = useSupabaseUser()
const router = useRouter()

watch(
  user,
  async (u) => {
    if (!u) return navigateTo('/auth/login')

    // If role isn't chosen yet, gate to choose-role
    return navigateTo('/auth/choose-role')
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen grid place-items-center text-sm text-gray-600">
    Redirecting…
  </div>
</template>

