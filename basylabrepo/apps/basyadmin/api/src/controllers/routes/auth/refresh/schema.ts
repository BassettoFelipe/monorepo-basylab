import { t } from 'elysia'

export const refreshBodySchema = t.Object({
	refreshToken: t.String(),
})

export const refreshResponseSchema = t.Object({
	accessToken: t.String(),
	refreshToken: t.String(),
})
