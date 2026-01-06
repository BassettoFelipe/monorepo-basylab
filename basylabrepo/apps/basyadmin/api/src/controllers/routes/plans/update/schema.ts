import { t } from 'elysia'

export const updatePlanParamsSchema = t.Object({
	tenantId: t.String(),
	planId: t.String(),
})

export const updatePlanBodySchema = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
	slug: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
	description: t.Optional(t.String()),
	priceCents: t.Optional(t.Number({ minimum: 0 })),
	currency: t.Optional(t.String({ maxLength: 3 })),
	billingInterval: t.Optional(t.Union([t.Literal('monthly'), t.Literal('yearly')])),
	isActive: t.Optional(t.Boolean()),
	displayOrder: t.Optional(t.Number()),
})

export const updatePlanResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
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
	}),
})
