import { t } from 'elysia'

export const assignFeatureParamsSchema = t.Object({
	tenantId: t.String(),
	planId: t.String(),
})

export const assignFeatureBodySchema = t.Object({
	featureId: t.String(),
	value: t.Optional(t.Unknown()),
})

export const assignFeatureResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
})
