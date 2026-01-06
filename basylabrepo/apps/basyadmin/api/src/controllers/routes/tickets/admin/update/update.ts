import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import {
	updateTicketAdminBodySchema,
	updateTicketAdminParamsSchema,
	updateTicketAdminResponseSchema,
} from './schema'

export const updateTicketAdminController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).put(
		'/tickets/:id',
		async ({ params, body, user }) => {
			const result = await container.tickets.update.execute({
				ticketId: params.id,
				userRole: user.role,
				userId: user.userId,
				...body,
			})
			return {
				success: true,
				message: 'Ticket atualizado com sucesso',
				data: result,
			}
		},
		{
			params: updateTicketAdminParamsSchema,
			body: updateTicketAdminBodySchema,
			response: {
				200: updateTicketAdminResponseSchema,
			},
		},
	),
)
