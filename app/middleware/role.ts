export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const profile = useState<{ role?: string } | null>('profile', () => null)

  if (!user.value) return

  const path = to.fullPath

  // Only /admin requires a specific role now
  if (path.startsWith('/admin')) {
    if (profile.value?.role !== 'admin') {
      return navigateTo('/dashboard')
    }
  }
})

