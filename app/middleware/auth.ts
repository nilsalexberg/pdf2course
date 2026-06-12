import type { User } from 'better-auth';

export default defineNuxtRouteMiddleware((to) => {
  const authUser = useState<User | null>('authUser');

  if (!authUser.value) {
    const redirect = encodeURIComponent(to.fullPath);
    return navigateTo(`/auth/login?redirect=${redirect}`);
  }
});
