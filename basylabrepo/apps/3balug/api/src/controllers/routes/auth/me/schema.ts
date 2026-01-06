import { t } from 'elysia'

export const meResponseSchema = {
	200: t.Object({
		user: t.Object({
			name: t.String(),
			email: t.String(),
			role: t.String(),
			phone: t.Union([t.String(), t.Null()]),
			avatarUrl: t.Union([t.String(), t.Null()]),
			isActive: t.Boolean(),
			isEmailVerified: t.Boolean(),
			hasPendingCustomFields: t.Boolean(),
			subscription: t.Union([
				t.Null(),
				t.Object({
					status: t.Union([
						t.Literal('active'),
						t.Literal('pending'),
						t.Literal('canceled'),
						t.Literal('expired'),
					]),
					daysRemaining: t.Union([t.Number(), t.Null()]),
					startDate: t.Any(),
					endDate: t.Union([t.Any(), t.Null()]),
					plan: t.Object({
						name: t.String(),
						price: t.Number(),
					}),
				}),
			]),
		}),
	}),
}
