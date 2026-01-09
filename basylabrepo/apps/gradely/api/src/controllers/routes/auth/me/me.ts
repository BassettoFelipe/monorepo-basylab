import { Elysia } from 'elysia'
import { auth } from '@/container'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { meResponseSchema } from './schema'

export const meController = new Elysia().use(requireAuth).get(
	'/auth/me',
	async ({ userId, set }) => {
		const result = await auth.getMe.execute({ userId })

		set.status = 200
		return {
			success: true as const,
			data: result,
		}
	},
	{
		response: meResponseSchema,
	},
)
