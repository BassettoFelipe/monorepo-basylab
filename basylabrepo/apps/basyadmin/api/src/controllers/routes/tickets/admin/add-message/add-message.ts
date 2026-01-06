import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import {
	addMessageAdminBodySchema,
	addMessageAdminParamsSchema,
	addMessageAdminResponseSchema,
} from './schema'

export const addMessageAdminController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).post(
		'/tickets/:id/messages',
		async ({ params, body, user }) => {
			const result = await container.tickets.addMessage.execute({
				ticketId: params.id,
				senderType: user.role,
				senderId: user.userId,
				content: body.content,
				attachments: body.attachments,
				userRole: user.role,
				userId: user.userId,
			})
			return {
				success: true,
				data: result,
			}
		},
		{
			params: addMessageAdminParamsSchema,
			body: addMessageAdminBodySchema,
			response: {
				200: addMessageAdminResponseSchema,
			},
		},
	),
)
