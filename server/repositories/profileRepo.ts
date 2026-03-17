import { createError } from 'h3'

export async function getRoleByUserId(client: any, userId: string): Promise<string | null> {
  const { data: profile, error } = await client.from('profiles').select('role').eq('id', userId).single()
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return (profile?.role ?? null) as string | null
}

