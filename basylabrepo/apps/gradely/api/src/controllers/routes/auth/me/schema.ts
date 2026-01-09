import { t } from 'elysia'

export const meResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		data: t.Object({
			id: t.String(),
			email: t.String(),
			name: t.String(),
			role: t.String(),
			phone: t.Union([t.String(), t.Null()]),
			avatarUrl: t.Union([t.String(), t.Null()]),
			isEmailVerified: t.Boolean(),
			createdAt: t.Date(),
		}),
	}),
	401: t.Object({
		success: t.Literal(false),
		error: t.Object({
			type: t.String(),
			message: t.String(),
		}),
	}),
}
