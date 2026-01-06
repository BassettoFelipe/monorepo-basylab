import { t } from 'elysia'

export const createTenantBodySchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 100 }),
	slug: t.String({ minLength: 1, maxLength: 50 }),
	logoUrl: t.Optional(t.String()),
	domain: t.Optional(t.String()),
	description: t.Optional(t.String()),
	settings: t.Optional(t.Record(t.String(), t.Unknown())),
})

export const createTenantResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
		id: t.String(),
		name: t.String(),
		slug: t.String(),
		logoUrl: t.Union([t.String(), t.Null()]),
		domain: t.Union([t.String(), t.Null()]),
		description: t.Union([t.String(), t.Null()]),
		apiKey: t.String(),
		apiKeyCreatedAt: t.Union([t.Date(), t.Null()]),
		settings: t.Unknown(),
		isActive: t.Union([t.Boolean(), t.Null()]),
		createdAt: t.Union([t.Date(), t.Null()]),
		updatedAt: t.Union([t.Date(), t.Null()]),
	}),
})
