import { t } from 'elysia'

export const listFeaturesQuerySchema = t.Object({
	search: t.Optional(t.String()),
	featureType: t.Optional(t.Union([t.Literal('boolean'), t.Literal('limit'), t.Literal('tier')])),
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),
})

const featureSchema = t.Object({
	id: t.String(),
	name: t.String(),
	slug: t.String(),
	description: t.Union([t.String(), t.Null()]),
	featureType: t.Union([t.String(), t.Null()]),
	createdAt: t.Union([t.Date(), t.Null()]),
	updatedAt: t.Union([t.Date(), t.Null()]),
})

export const listFeaturesResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(featureSchema),
	total: t.Number(),
	limit: t.Number(),
	offset: t.Number(),
})
