<script setup lang="ts">
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
    if (!role) {
      return navigateTo('/auth/choose-role')
    }
    
    if (role === 'producer') {
      return navigateTo('/producer')
    } else if (role === 'student') {
      return navigateTo('/learn')
    } else if (role === 'admin') {
      return navigateTo('/admin')
    }

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

