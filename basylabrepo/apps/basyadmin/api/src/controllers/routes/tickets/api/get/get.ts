import { Elysia } from 'elysia'
import { container } from '@/container'
import { apiKeyMiddleware } from '@/controllers/middlewares'
import { getTicketApiParamsSchema, getTicketApiResponseSchema } from './schema'

export const getTicketApiController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(apiKeyMiddleware).get(
		'/api/v1/tickets/:id',
		async ({ params, tenant }) => {
			const result = await container.tickets.get.execute({
				ticketId: params.id,
				userRole: 'owner',
				userId: '',
				tenantId: tenant.id,
			})
			return result
		},
		{
			params: getTicketApiParamsSchema,
			response: {
				200: getTicketApiResponseSchema,
			},
		},
	),
)
