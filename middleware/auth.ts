export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value) {
    const redirect = encodeURIComponent(to.fullPath)
    return navigateTo(`/auth/login?redirect=${redirect}`)
  }
})

