import { Elysia } from 'elysia'
import { auth } from '@/container'
import { requireAuth } from '@/controllers/middlewares/auth.middleware'
import { validateUserStateAllowPending } from '@/controllers/middlewares/user-validation.middleware'
import { meResponseSchema } from './schema'

export const meController = new Elysia().guard({ as: 'local' }, (app) =>
	app
		.use(requireAuth)
		.use(validateUserStateAllowPending)
		.get(
			'/auth/me',
			async ({ validatedUser, validatedSubscription }) => {
				const result = await auth.getMe.execute({
					user: validatedUser,
					subscription: validatedSubscription,
				})

				return result
			},
			{
				response: meResponseSchema,
			},
		),
)
