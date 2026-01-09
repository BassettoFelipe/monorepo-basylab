import { t } from 'elysia'

export const refreshBodySchema = t.Object({
	refreshToken: t.String(),
})

export const refreshResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		data: t.Object({
			accessToken: t.String(),
			refreshToken: t.String(),
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
