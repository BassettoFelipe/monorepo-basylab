import { t } from 'elysia'

export const updateFeatureParamsSchema = t.Object({
	id: t.String(),
})

export const updateFeatureBodySchema = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
	slug: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
	description: t.Optional(t.String()),
	featureType: t.Optional(t.Union([t.Literal('boolean'), t.Literal('limit'), t.Literal('tier')])),
})

export const updateFeatureResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
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
