import { t } from 'elysia'

export const resendPasswordResetCodeBodySchema = t.Object({
	email: t.String({
		format: 'email',
		error: 'Email inválido',
	}),
})

export const resendPasswordResetCodeResponseSchema = {
	200: t.Object({
		remainingResendAttempts: t.Number(),
		canResendAt: t.String(),
		codeExpiresAt: t.String(),
	}),
}
