<script setup lang="ts">
useHead({ title: 'pdf2course' })

const user = useSupabaseUser()
const { profile, refresh } = useProfile()

watch(
  user,
  async (u: any) => {
    if (!u) return navigateTo('/auth/login')

    if (!profile.value) {
      await refresh()
    }

    const role = profile.value?.role
    
    if (role === 'admin') {
      return navigateTo('/admin')
    }

    return navigateTo('/dashboard')
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-screen grid place-items-center text-sm text-gray-600">
    Redirecting…
  </div>
</template>

