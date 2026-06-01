import { requireUser } from '../../auth/requireUser'
import { updateProfile } from '../../repositories/profileRepo'
import { readMultipart, parseMultipart } from '../../http/multipart'
import { buildAvatarPath, validateAvatarFile, uploadAvatar } from '../../storage/avatars'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const parts = await readMultipart(event)
  const { files } = parseMultipart(parts)
  const avatarFile = files.avatar

  if (!avatarFile) {
    throw createError({ statusCode: 400, statusMessage: 'No avatar file provided' })
  }

  validateAvatarFile(avatarFile)
  const path = buildAvatarPath(user.id, avatarFile.filename)
  const avatarUrl = await uploadAvatar(path, avatarFile)

  return updateProfile(user.id, { avatar_url: avatarUrl })
})
