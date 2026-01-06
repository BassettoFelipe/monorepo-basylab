import { t } from 'elysia'

export const batchEventBodySchema = t.Object({
	events: t.Array(
		t.Object({
			eventName: t.String({ minLength: 1, maxLength: 100 }),
			userId: t.Optional(t.String()),
			properties: t.Optional(t.Record(t.String(), t.Unknown())),
		}),
	),
})

const eventSchema = t.Object({
	id: t.String(),
	tenantId: t.String(),
	eventName: t.String(),
	userId: t.Union([t.String(), t.Null()]),
	properties: t.Unknown(),
	createdAt: t.Union([t.Date(), t.Null()]),
})

export const batchEventResponseSchema = t.Array(eventSchema)
