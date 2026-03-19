export function useProfile() {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = useState<any | null>('profile', () => null)
  const loading = useState<boolean>('profile-loading', () => false)

  async function fetchProfile() {
    if (!user.value) {
      profile.value = null
      return
    }

    loading.value = true
    try {
      const { data, error } = await client.from('profiles').select('*').eq('id', user.value.id).single()
      if (error) throw error
      profile.value = data
    } catch {
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  watch(
    user,
    () => {
      fetchProfile()
    },
    { immediate: true },
  )

  return {
    profile,
    loading,
    refresh: fetchProfile,
  }
}

