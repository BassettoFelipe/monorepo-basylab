import { t } from 'elysia'

export const updateTicketAdminParamsSchema = t.Object({
	id: t.String(),
})

export const updateTicketAdminBodySchema = t.Object({
	status: t.Optional(
		t.Union([
			t.Literal('open'),
			t.Literal('in_progress'),
			t.Literal('waiting'),
			t.Literal('resolved'),
			t.Literal('closed'),
		]),
	),
	priority: t.Optional(
		t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high'), t.Literal('urgent')]),
	),
	assignedTo: t.Optional(t.Union([t.String(), t.Null()])),
	category: t.Optional(t.Union([t.String(), t.Null()])),
})

export const updateTicketAdminResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.String(),
	data: t.Object({
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
	}),
})
