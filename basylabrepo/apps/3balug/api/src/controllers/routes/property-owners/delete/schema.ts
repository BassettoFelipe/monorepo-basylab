import { t } from 'elysia'

export const deletePropertyOwnerParamsSchema = t.Object({
	id: t.String({ format: 'uuid' }),
})

export const deletePropertyOwnerResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
