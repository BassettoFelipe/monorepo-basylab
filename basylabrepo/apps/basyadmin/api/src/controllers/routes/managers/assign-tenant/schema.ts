import { t } from 'elysia'

export const assignTenantParamsSchema = t.Object({
	id: t.String(),
})

export const assignTenantBodySchema = t.Object({
	tenantId: t.String(),
})

export const assignTenantResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
