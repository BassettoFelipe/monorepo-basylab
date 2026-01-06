import { t } from 'elysia'

export const aggregateEventsQuerySchema = t.Object({
	tenantId: t.String(),
	startDate: t.Optional(t.String()),
	endDate: t.Optional(t.String()),
})

const aggregateSchema = t.Object({
	eventName: t.String(),
	count: t.Number(),
	uniqueUsers: t.Number(),
})

export const aggregateEventsResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Array(aggregateSchema),
})
