import { t } from 'elysia'

export const deleteManagerParamsSchema = t.Object({
	id: t.String(),
})

export const deleteManagerResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
