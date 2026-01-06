import { t } from 'elysia'

export const passwordResetStatusQuerySchema = t.Object({
	email: t.String({
		format: 'email',
		error: 'Email inválido',
	}),
})

export const passwordResetStatusResponseSchema = {
	200: t.Object({
		canResend: t.Boolean(),
		remainingResendAttempts: t.Number(),
		canResendAt: t.Nullable(t.String()),
		remainingCodeAttempts: t.Number(),
		canTryCodeAt: t.Nullable(t.String()),
		isResendBlocked: t.Boolean(),
		resendBlockedUntil: t.Nullable(t.String()),
		codeExpiresAt: t.Nullable(t.String()),
	}),
}
