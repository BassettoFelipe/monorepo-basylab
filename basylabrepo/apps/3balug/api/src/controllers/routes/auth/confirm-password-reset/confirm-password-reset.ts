import { Elysia } from 'elysia'
import { auth } from '@/container'
import { confirmPasswordResetBodySchema, confirmPasswordResetResponseSchema } from './schema'

export const confirmPasswordResetController = new Elysia().post(
	'/auth/confirm-password-reset',
	async ({ body, set }) => {
		const result = await auth.confirmPasswordReset.execute(body)

		set.status = 200
		return {
			message: result.message,
			success: true,
		}
	},
	{
		body: confirmPasswordResetBodySchema,
		response: confirmPasswordResetResponseSchema,
		detail: {
			tags: ['Auth'],
			summary: 'Confirm password reset',
			description: 'Confirm password reset with code and set new password',
		},
	},
)
