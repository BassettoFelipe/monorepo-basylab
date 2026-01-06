import { Elysia } from 'elysia'
import { container } from '@/container'
import { apiKeyMiddleware } from '@/controllers/middlewares'
import {
	addMessageApiBodySchema,
	addMessageApiParamsSchema,
	addMessageApiResponseSchema,
} from './schema'

export const addMessageApiController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(apiKeyMiddleware).post(
		'/api/v1/tickets/:id/messages',
		async ({ params, body, tenant }) => {
			const result = await container.tickets.addMessage.execute({
				ticketId: params.id,
				senderType: 'user',
				senderId: body.senderId,
				content: body.content,
				attachments: body.attachments,
				tenantId: tenant.id,
			})
			return result
		},
		{
			params: addMessageApiParamsSchema,
			body: addMessageApiBodySchema,
			response: {
				200: addMessageApiResponseSchema,
			},
		},
	),
)
