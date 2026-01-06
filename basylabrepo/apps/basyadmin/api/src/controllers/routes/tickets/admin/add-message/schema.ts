import { t } from 'elysia'

export const addMessageAdminParamsSchema = t.Object({
	id: t.String(),
})

export const addMessageAdminBodySchema = t.Object({
	content: t.String({ minLength: 1 }),
	attachments: t.Optional(t.Array(t.Unknown())),
})

export const addMessageAdminResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Object({
		id: t.String(),
		ticketId: t.String(),
		senderType: t.String(),
		senderId: t.Union([t.String(), t.Null()]),
		content: t.String(),
		attachments: t.Unknown(),
		createdAt: t.Union([t.Date(), t.Null()]),
	}),
})
