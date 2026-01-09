import { t } from 'elysia'

export const loginBodySchema = t.Object({
	email: t.String({ format: 'email' }),
	password: t.String({ minLength: 6 }),
})

export const loginResponseSchema = {
	200: t.Object({
		success: t.Literal(true),
		data: t.Object({
			user: t.Object({
				id: t.String(),
				email: t.String(),
				name: t.String(),
				role: t.String(),
			}),
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
	422: t.Object({
		success: t.Literal(false),
		error: t.Object({
			type: t.String(),
			message: t.String(),
		}),
	}),
}
