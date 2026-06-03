export function useProfile() {
  const authUser = useState<any>('authUser', () => null);
  const profile = useState<any | null>('profile', () => null);
  const loading = useState<boolean>('profile-loading', () => false);

  async function fetchProfile() {
    if (!authUser.value) {
      profile.value = null;
      return;
    }
    loading.value = true;
    try {
      const data = await $fetch<{ profile: any }>('/api/me');
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
