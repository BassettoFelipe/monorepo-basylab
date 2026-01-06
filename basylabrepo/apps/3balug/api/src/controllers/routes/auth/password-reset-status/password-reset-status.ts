import { Elysia } from 'elysia'
import { auth } from '@/container'
import { passwordResetStatusQuerySchema, passwordResetStatusResponseSchema } from './schema'

export const passwordResetStatusController = new Elysia().get(
	'/auth/password-reset-status',
	async ({ query }) => {
		const result = await auth.getPasswordResetStatus.execute({
			email: query.email,
		})

		return {
			canResend: result.canResend,
			remainingResendAttempts: result.remainingResendAttempts,
			canResendAt: result.canResendAt,
			remainingCodeAttempts: result.remainingCodeAttempts,
			canTryCodeAt: result.canTryCodeAt,
			isResendBlocked: result.isResendBlocked,
			resendBlockedUntil: result.resendBlockedUntil,
			codeExpiresAt: result.codeExpiresAt,
		}
	},
	{
		query: passwordResetStatusQuerySchema,
		response: passwordResetStatusResponseSchema,
		detail: {
			tags: ['Auth'],
			summary: 'Get password reset status',
			description: 'Check password reset status. Sends initial email if no active code exists.',
		},
	},
)
