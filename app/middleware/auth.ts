export default defineNuxtRouteMiddleware((to) => {
  const authUser = useState<any>('authUser');

  if (!authUser.value) {
    const redirect = encodeURIComponent(to.fullPath);
    return navigateTo(`/auth/login?redirect=${redirect}`);
  }
});
