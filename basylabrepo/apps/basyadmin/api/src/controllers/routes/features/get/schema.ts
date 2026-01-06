import { t } from 'elysia'

export const getFeatureParamsSchema = t.Object({
	id: t.String(),
})

export const getFeatureResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Object({
		id: t.String(),
		name: t.String(),
		slug: t.String(),
		description: t.Union([t.String(), t.Null()]),
		featureType: t.Union([t.String(), t.Null()]),
		createdAt: t.Union([t.Date(), t.Null()]),
		updatedAt: t.Union([t.Date(), t.Null()]),
	}),
})
