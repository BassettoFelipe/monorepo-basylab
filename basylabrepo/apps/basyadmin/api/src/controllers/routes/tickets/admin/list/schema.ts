import { t } from 'elysia'

const ticketSchema = t.Object({
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

export const listTicketsAdminResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(ticketSchema),
	total: t.Number(),
	limit: t.Number(),
	offset: t.Number(),
})
