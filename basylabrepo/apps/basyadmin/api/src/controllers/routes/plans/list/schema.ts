import { t } from 'elysia'

export const listPlansParamsSchema = t.Object({
	tenantId: t.String(),
})

const planSchema = t.Object({
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
})

export const listPlansResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(planSchema),
})
