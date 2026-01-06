import { t } from 'elysia'

export const listBillingQuerySchema = t.Object({
	tenantId: t.Optional(t.String()),
	status: t.Optional(t.String()),
	startDate: t.Optional(t.String()),
	endDate: t.Optional(t.String()),
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),
})

const billingSchema = t.Object({
	id: t.String(),
	tenantId: t.String(),
	externalCustomerId: t.Union([t.String(), t.Null()]),
	customerEmail: t.Union([t.String(), t.Null()]),
	planSlug: t.Union([t.String(), t.Null()]),
	amountCents: t.Number(),
	currency: t.Union([t.String(), t.Null()]),
	status: t.String(),
	paidAt: t.Union([t.Date(), t.Null()]),
	metadata: t.Unknown(),
	createdAt: t.Union([t.Date(), t.Null()]),
})

export const listBillingResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(billingSchema),
	total: t.Number(),
	limit: t.Number(),
	offset: t.Number(),
})
