import { Elysia } from 'elysia'
import { auth } from '@/container'
import { passwordResetRateLimitPlugin } from '@/plugins/rate-limit.plugin'
import { resendPasswordResetCodeBodySchema, resendPasswordResetCodeResponseSchema } from './schema'

export const resendPasswordResetCodeController = new Elysia()
	.use(passwordResetRateLimitPlugin)
	.post(
		'/auth/resend-password-reset-code',
		async ({ body }) => {
			const result = await auth.resendPasswordResetCode.execute(body)

			return {
				remainingResendAttempts: result.remainingResendAttempts,
				canResendAt: result.canResendAt,
				codeExpiresAt: result.codeExpiresAt,
			}
		},
		{
			body: resendPasswordResetCodeBodySchema,
			response: resendPasswordResetCodeResponseSchema,
			detail: {
				tags: ['Auth'],
				summary: 'Resend password reset code',
				description: "Resend a new password reset verification code to the user's email",
			},
		},
	)
