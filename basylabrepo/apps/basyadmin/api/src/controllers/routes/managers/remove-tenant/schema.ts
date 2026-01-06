import { t } from 'elysia'

export const removeTenantParamsSchema = t.Object({
	id: t.String(),
	tenantId: t.String(),
})

export const removeTenantResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
