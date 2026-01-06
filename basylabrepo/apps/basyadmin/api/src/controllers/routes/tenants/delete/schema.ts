import { t } from 'elysia'

export const deleteTenantParamsSchema = t.Object({
	tenantId: t.String(),
})

export const deleteTenantResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
