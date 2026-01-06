import { Elysia } from 'elysia'
import { container } from '@/container'
import { apiKeyMiddleware } from '@/controllers/middlewares'
import { batchEventBodySchema, batchEventResponseSchema } from './schema'

export const batchEventApiController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(apiKeyMiddleware).post(
		'/api/v1/events/batch',
		async ({ body, tenant }) => {
			const result = await container.events.createBatch.execute({
				tenantId: tenant.id,
				events: body.events,
			})
			return result
		},
		{
			body: batchEventBodySchema,
			response: {
				200: batchEventResponseSchema,
			},
		},
	),
)
