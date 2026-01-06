import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { listTicketsAdminResponseSchema } from './schema'

export const listTicketsAdminController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/tickets',
		async ({ user }) => {
			const result = await container.tickets.list.execute({
				userRole: user.role,
				userId: user.userId,
			})
			return {
				success: true,
				...result,
			}
		},
		{
			response: {
				200: listTicketsAdminResponseSchema,
			},
		},
	),
)
