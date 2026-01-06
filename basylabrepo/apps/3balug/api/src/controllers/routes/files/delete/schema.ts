import { t } from 'elysia'

export const deleteFileParamsSchema = t.Object({
	key: t.String(),
})

export const deleteFileResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
