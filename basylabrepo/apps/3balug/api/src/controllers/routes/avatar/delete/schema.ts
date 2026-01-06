import { t } from 'elysia'

export const deleteAvatarResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
