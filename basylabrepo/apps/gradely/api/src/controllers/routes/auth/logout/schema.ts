import { t } from 'elysia'

export const logoutBodySchema = t.Object({
	refreshToken: t.String(),
})

export const logoutResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		data: t.Object({
			success: t.Boolean(),
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
