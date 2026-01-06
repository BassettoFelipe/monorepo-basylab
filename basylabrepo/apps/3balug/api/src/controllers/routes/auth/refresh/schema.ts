import { t } from 'elysia'

export const refreshResponseSchema = {
	200: t.Object({
		accessToken: t.String(),
		// refreshToken now in httpOnly cookie (not in response body)
	}),
}
