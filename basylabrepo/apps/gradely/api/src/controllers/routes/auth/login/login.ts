import { Elysia } from 'elysia'
import { auth } from '@/container'
import { loginRateLimiter } from '@/plugins/rate-limit.plugin'
import { loginBodySchema, loginResponseSchema } from './schema'

export const loginController = new Elysia().use(loginRateLimiter).post(
	'/auth/login',
	async ({ body, set }) => {
		const result = await auth.login.execute({
			email: body.email,
			password: body.password,
		})

		set.status = 200
		return {
			success: true as const,
			data: result,
		}
	},
	{
		body: loginBodySchema,
		response: loginResponseSchema,
	},
)
