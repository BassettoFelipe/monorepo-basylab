import { t } from 'elysia'

export const addMessageApiParamsSchema = t.Object({
	id: t.String(),
})

export const addMessageApiBodySchema = t.Object({
	senderId: t.Optional(t.String()),
	content: t.String({ minLength: 1 }),
	attachments: t.Optional(t.Array(t.Unknown())),
})

export const addMessageApiResponseSchema = t.Object({
	id: t.String(),
	ticketId: t.String(),
	senderType: t.String(),
	senderId: t.Union([t.String(), t.Null()]),
	content: t.String(),
	attachments: t.Unknown(),
	createdAt: t.Union([t.Date(), t.Null()]),
})
