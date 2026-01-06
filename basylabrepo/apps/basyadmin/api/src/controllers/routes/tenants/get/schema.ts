import { t } from 'elysia'

export const getTenantParamsSchema = t.Object({
	tenantId: t.String(),
})

export const getTenantResponseSchema = t.Object({
	success: t.Boolean(),
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
