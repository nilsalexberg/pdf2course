export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  if (!user) {
    return {
      user: null,
      profile: null,
    }
  }

  const { data: profile } = await client.from('profiles').select('*').eq('id', user.id).single()

  return {
    user,
    profile,
  }
})

