import { t } from 'elysia'

export const confirmEmailBodySchema = t.Object({
	email: t.String({ format: 'email' }),
	code: t.String({ minLength: 6, maxLength: 6 }),
})

export const confirmEmailResponseSchema = {
	200: t.Object({
		success: t.Boolean(),
		message: t.String(),
		checkoutToken: t.String(),
		checkoutExpiresAt: t.String({ format: 'date-time' }),
	}),
}
