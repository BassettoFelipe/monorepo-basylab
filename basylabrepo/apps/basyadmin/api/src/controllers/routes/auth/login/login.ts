import { Elysia } from 'elysia'
import { container } from '@/container'
import { loginBodySchema, loginResponseSchema } from './schema'

export const loginController = new Elysia().post(
	'/auth/login',
	async ({ body }) => {
		const result = await container.auth.login.execute(body)
		return result
	},
	{
		body: loginBodySchema,
		response: {
			200: loginResponseSchema,
		},
	},
)
