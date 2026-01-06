import { Elysia } from 'elysia'
import { container } from '@/container'
import { authMiddleware } from '@/controllers/middlewares'
import { meResponseSchema } from './schema'

export const meController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(authMiddleware).get(
		'/auth/me',
		async ({ user }) => {
			const result = await container.auth.getCurrentUser.execute({
				userId: user.userId,
			})
			return result
		},
		{
			response: {
				200: meResponseSchema,
			},
		},
	),
)
