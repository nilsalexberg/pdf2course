import type { User } from 'better-auth';
import type { Profile } from '@@/types/profile';

export function useProfile() {
  const authUser = useState<User | null>('authUser', () => null);
  const profile = useState<Profile | null>('profile', () => null);
  const loading = useState<boolean>('profile-loading', () => false);

  async function fetchProfile() {
    if (!authUser.value) {
      profile.value = null;
      return;
    }
    loading.value = true;
    try {
      const data = await $fetch<{ profile: Profile }>('/api/me');
      profile.value = data?.profile ?? null;
    } catch {
      profile.value = null;
    } finally {
      loading.value = false;
    }
  }

  watch(
    authUser,
    () => {
      fetchProfile();
    },
    { immediate: true }
  );

  return {
    profile,
    loading,
    refresh: fetchProfile
  };
}
