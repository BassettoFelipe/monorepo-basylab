import { t } from 'elysia'

export const getTicketAdminParamsSchema = t.Object({
	id: t.String(),
})

const messageSchema = t.Object({
	id: t.String(),
	ticketId: t.String(),
	senderType: t.String(),
	senderId: t.Union([t.String(), t.Null()]),
	content: t.String(),
	attachments: t.Unknown(),
	createdAt: t.Union([t.Date(), t.Null()]),
})

export const getTicketAdminResponseSchema = t.Object({
	success: t.Boolean(),
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
		messages: t.Array(messageSchema),
	}),
})
