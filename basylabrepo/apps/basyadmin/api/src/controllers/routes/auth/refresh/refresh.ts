import { Elysia } from 'elysia'
import { container } from '@/container'
import { refreshBodySchema, refreshResponseSchema } from './schema'

export const refreshController = new Elysia().post(
	'/auth/refresh',
	async ({ body }) => {
		const result = await container.auth.refreshToken.execute(body)
		return result
	},
	{
		body: refreshBodySchema,
		response: {
			200: refreshResponseSchema,
		},
	},
)
