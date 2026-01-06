import { t } from 'elysia'

export const listEventsQuerySchema = t.Object({
	tenantId: t.Optional(t.String()),
	eventName: t.Optional(t.String()),
	userId: t.Optional(t.String()),
	startDate: t.Optional(t.String()),
	endDate: t.Optional(t.String()),
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),
})

const eventSchema = t.Object({
	id: t.String(),
	tenantId: t.String(),
	eventName: t.String(),
	userId: t.Union([t.String(), t.Null()]),
	properties: t.Unknown(),
	createdAt: t.Union([t.Date(), t.Null()]),
})

export const listEventsResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(eventSchema),
	total: t.Number(),
	limit: t.Number(),
	offset: t.Number(),
})
