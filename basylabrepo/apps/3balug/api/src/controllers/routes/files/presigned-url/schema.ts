import { t } from 'elysia'

export const presignedUrlBodySchema = t.Object({
	fileName: t.String({ minLength: 1 }),
	contentType: t.String({ minLength: 1 }),
	fieldId: t.Optional(t.String()),
	allowedTypes: t.Optional(t.Array(t.String())),
})

export const presignedUrlResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		uploadUrl: t.String(),
		key: t.String(),
		publicUrl: t.String(),
		expiresAt: t.Date(),
	}),
})
