import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { getTicketAdminParamsSchema, getTicketAdminResponseSchema } from './schema'

export const getTicketAdminController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/tickets/:id',
		async ({ params, user }) => {
			const result = await container.tickets.get.execute({
				ticketId: params.id,
				userRole: user.role,
				userId: user.userId,
			})
			return {
				success: true,
				data: result,
			}
		},
		{
			params: getTicketAdminParamsSchema,
			response: {
				200: getTicketAdminResponseSchema,
			},
		},
	),
)
