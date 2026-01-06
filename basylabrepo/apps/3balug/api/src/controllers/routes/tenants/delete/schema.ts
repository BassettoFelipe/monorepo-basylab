import { t } from 'elysia'

export const deleteTenantParamsSchema = t.Object({
	id: t.String({ format: 'uuid' }),
})

export const deleteTenantResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
