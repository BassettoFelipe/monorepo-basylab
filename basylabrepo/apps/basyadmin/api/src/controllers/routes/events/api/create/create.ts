import { Elysia } from 'elysia'
import { container } from '@/container'
import { apiKeyMiddleware } from '@/controllers/middlewares'
import { createEventBodySchema, createEventResponseSchema } from './schema'

export const createEventApiController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(apiKeyMiddleware).post(
		'/api/v1/events',
		async ({ body, tenant }) => {
			const result = await container.events.create.execute({
				tenantId: tenant.id,
				eventName: body.eventName,
				userId: body.userId,
				properties: body.properties,
			})
			return result
		},
		{
			body: createEventBodySchema,
			response: {
				200: createEventResponseSchema,
			},
		},
	),
)
