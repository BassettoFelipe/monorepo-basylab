import { t } from 'elysia'

export const createTicketApiBodySchema = t.Object({
	externalUserId: t.Optional(t.String()),
	externalUserEmail: t.Optional(t.String()),
	title: t.String({ minLength: 1, maxLength: 255 }),
	description: t.Optional(t.String()),
	priority: t.Optional(
		t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high'), t.Literal('urgent')]),
	),
	category: t.Optional(t.String()),
	metadata: t.Optional(t.Record(t.String(), t.Unknown())),
})

export const createTicketApiResponseSchema = t.Object({
	id: t.String(),
	tenantId: t.String(),
	externalUserId: t.Union([t.String(), t.Null()]),
	externalUserEmail: t.Union([t.String(), t.Null()]),
	title: t.String(),
	description: t.Union([t.String(), t.Null()]),
	priority: t.Union([t.String(), t.Null()]),
	status: t.Union([t.String(), t.Null()]),
	category: t.Union([t.String(), t.Null()]),
	metadata: t.Unknown(),
	assignedTo: t.Union([t.String(), t.Null()]),
	resolvedAt: t.Union([t.Date(), t.Null()]),
	createdAt: t.Union([t.Date(), t.Null()]),
	updatedAt: t.Union([t.Date(), t.Null()]),
})
