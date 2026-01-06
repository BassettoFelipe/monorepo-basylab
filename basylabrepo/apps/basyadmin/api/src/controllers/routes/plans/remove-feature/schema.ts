import { t } from 'elysia'

export const removeFeatureParamsSchema = t.Object({
	tenantId: t.String(),
	planId: t.String(),
	featureId: t.String(),
})

export const removeFeatureResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
