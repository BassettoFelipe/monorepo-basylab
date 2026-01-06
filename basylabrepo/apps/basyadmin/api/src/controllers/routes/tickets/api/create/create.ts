import { Elysia } from 'elysia'
import { container } from '@/container'
import { apiKeyMiddleware } from '@/controllers/middlewares'
import { createTicketApiBodySchema, createTicketApiResponseSchema } from './schema'

export const createTicketApiController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(apiKeyMiddleware).post(
		'/api/v1/tickets',
		async ({ body, tenant }) => {
			const result = await container.tickets.create.execute({
				tenantId: tenant.id,
				...body,
			})
			return result
		},
		{
			body: createTicketApiBodySchema,
			response: {
				200: createTicketApiResponseSchema,
			},
		},
	),
)
