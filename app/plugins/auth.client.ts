import { createAuthClient } from 'better-auth/client';
import type { User } from 'better-auth';

export default defineNuxtPlugin(async () => {
  const authClient = createAuthClient({ baseURL: window.location.origin });

  const authUser = useState<User | null>('authUser', () => null);
  const authLoaded = useState<boolean>('authLoaded', () => false);

  const { data } = await authClient.getSession();
  authUser.value = data?.user ?? null;
  authLoaded.value = true;

  return {
    provide: { authClient }
  };
});
