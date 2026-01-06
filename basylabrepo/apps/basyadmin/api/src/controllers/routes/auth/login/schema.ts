import { t } from 'elysia'

export const loginBodySchema = t.Object({
	email: t.String({ format: 'email' }),
	password: t.String({ minLength: 1 }),
})

export const loginResponseSchema = t.Object({
	accessToken: t.String(),
	refreshToken: t.String(),
	user: t.Object({
		id: t.String(),
		email: t.String(),
		name: t.String(),
		role: t.Union([t.Literal('owner'), t.Literal('manager')]),
	}),
})
