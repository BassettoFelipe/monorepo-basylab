import { t } from 'elysia'

export const getPlanParamsSchema = t.Object({
	tenantId: t.String(),
	planId: t.String(),
})

export const getPlanResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Object({
		id: t.String(),
		tenantId: t.String(),
		name: t.String(),
		slug: t.String(),
		description: t.Union([t.String(), t.Null()]),
		priceCents: t.Number(),
		currency: t.Union([t.String(), t.Null()]),
		billingInterval: t.Union([t.String(), t.Null()]),
		isActive: t.Union([t.Boolean(), t.Null()]),
		displayOrder: t.Union([t.Number(), t.Null()]),
		createdAt: t.Union([t.Date(), t.Null()]),
		updatedAt: t.Union([t.Date(), t.Null()]),
		features: t.Array(
			t.Object({
				featureId: t.String(),
				featureSlug: t.String(),
				featureName: t.String(),
				value: t.Unknown(),
			}),
		),
	}),
})
