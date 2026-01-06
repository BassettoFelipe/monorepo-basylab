import { t } from 'elysia'

export const loginBodySchema = t.Object({
	email: t.String({ format: 'email' }),
	password: t.String(),
})

export const loginResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		message: t.String(),
		data: t.Object({
			user: t.Object({
				email: t.String(),
				name: t.String(),
				role: t.String(),
				hasPendingCustomFields: t.Boolean(),
			}),
			subscription: t.Object({
				status: t.Union([
					t.Literal('active'),
					t.Literal('pending'),
					t.Literal('canceled'),
					t.Literal('expired'),
				]),
				startDate: t.Any(),
				endDate: t.Union([t.Any(), t.Null()]),
				plan: t.Object({
					name: t.String(),
					price: t.Number(),
					features: t.Array(t.String()),
				}),
				daysRemaining: t.Union([t.Number(), t.Null()]),
			}),
			accessToken: t.String(),
			checkoutToken: t.Optional(t.String()),
			checkoutExpiresAt: t.Optional(t.String()),
		}),
	}),
	429: t.Object({
		success: t.Literal(false),
		message: t.String(),
		type: t.String(),
		retryAt: t.String(),
	}),
}
