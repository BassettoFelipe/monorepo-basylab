import { Elysia } from 'elysia'
import { auth } from '@/container'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { logoutBodySchema, logoutResponseSchema } from './schema'

export const logoutController = new Elysia().use(requireAuth).post(
	'/auth/logout',
	async ({ body, request, set }) => {
		const authHeader = request.headers.get('authorization')
		const accessToken = authHeader?.replace('Bearer ', '') ?? ''

		const result = await auth.logout.execute({
			accessToken,
			refreshToken: body.refreshToken,
		})

		set.status = 200
		return {
			success: true as const,
			data: result,
		}
	},
	{
		body: logoutBodySchema,
		response: logoutResponseSchema,
	},
)
