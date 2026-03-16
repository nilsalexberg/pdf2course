export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const profile = useState<{ role?: 'admin' | 'producer' | 'student' } | null>('profile', () => null)

  if (!user.value) return

  const path = to.fullPath

  const requiredRole =
    path.startsWith('/admin')
      ? 'admin'
      : path.startsWith('/producer')
        ? 'producer'
        : path.startsWith('/learn')
          ? 'student'
          : null

  if (!requiredRole) return

  const currentRole = profile.value?.role

  if (!currentRole) {
    return navigateTo('/auth/choose-role')
  }

  if (currentRole !== requiredRole) {
    if (currentRole === 'admin') {
      return navigateTo('/admin')
    }
    if (currentRole === 'producer') {
      return navigateTo('/producer')
    }
    if (currentRole === 'student') {
      return navigateTo('/learn')
    }
  }
})

