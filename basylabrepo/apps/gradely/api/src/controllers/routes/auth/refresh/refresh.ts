import { Elysia } from 'elysia'
import { auth } from '@/container'
import { authRateLimiter } from '@/plugins/rate-limit.plugin'
import { refreshBodySchema, refreshResponseSchema } from './schema'

export const refreshController = new Elysia().use(authRateLimiter).post(
	'/auth/refresh',
	async ({ body, set }) => {
		const result = await auth.refreshToken.execute({
			refreshToken: body.refreshToken,
		})

		set.status = 200
		return {
			success: true as const,
			data: result,
		}
	},
	{
		body: refreshBodySchema,
		response: refreshResponseSchema,
	},
)
