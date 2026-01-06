import { Elysia } from 'elysia'
import { container } from '@/container'
import { apiKeyMiddleware } from '@/controllers/middlewares'
import { listTicketsApiResponseSchema } from './schema'

export const listTicketsApiController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(apiKeyMiddleware).get(
		'/api/v1/tickets',
		async ({ tenant }) => {
			const result = await container.tickets.list.execute({
				userRole: 'owner',
				userId: '',
				tenantId: tenant.id,
			})
			return result.data
		},
		{
			response: {
				200: listTicketsApiResponseSchema,
			},
		},
	),
)
