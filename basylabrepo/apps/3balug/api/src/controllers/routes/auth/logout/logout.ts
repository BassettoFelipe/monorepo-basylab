import { Elysia } from 'elysia'
import { logoutResponseSchema } from './schema'

export const logoutController = new Elysia().post(
	'/auth/logout',
	async ({ cookie: { refreshToken } }) => {
		refreshToken.remove()

		return {
			success: true as const,
			message: 'Logout realizado com sucesso',
		}
	},
	{
		response: logoutResponseSchema,
	},
)
