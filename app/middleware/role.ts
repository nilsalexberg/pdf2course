export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const { profile, refresh } = useProfile()

  if (!user.value) return

  // Ensure profile is loaded if it's currently null
  if (!profile.value) {
    await refresh()
  }

  const path = to.fullPath

  // Only /admin requires a specific role now
  if (path.startsWith('/admin')) {
    if (profile.value?.role !== 'admin') {
      return navigateTo('/dashboard')
    }
  }
})


