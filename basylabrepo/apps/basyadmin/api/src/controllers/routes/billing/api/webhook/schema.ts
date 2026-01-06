import { t } from 'elysia'

export const billingWebhookBodySchema = t.Object({
	customerId: t.Optional(t.String()),
	customerEmail: t.Optional(t.String()),
	planSlug: t.Optional(t.String()),
	amountCents: t.Number(),
	currency: t.Optional(t.String()),
	status: t.Union([
		t.Literal('paid'),
		t.Literal('pending'),
		t.Literal('failed'),
		t.Literal('refunded'),
	]),
	metadata: t.Optional(t.Record(t.String(), t.Unknown())),
})

export const billingWebhookResponseSchema = t.Object({
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
