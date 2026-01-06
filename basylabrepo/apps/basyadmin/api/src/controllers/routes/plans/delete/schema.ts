import { t } from 'elysia'

export const deletePlanParamsSchema = t.Object({
	tenantId: t.String(),
	planId: t.String(),
})

export const deletePlanResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
