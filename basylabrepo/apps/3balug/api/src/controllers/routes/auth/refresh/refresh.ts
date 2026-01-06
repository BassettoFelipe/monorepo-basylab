import { InvalidTokenError } from '@basylab/core/errors'
import { Elysia } from 'elysia'
import { env } from '@/config/env'
import { auth } from '@/container'
import { refreshResponseSchema } from './schema'

const REFRESH_TOKEN_COOKIE_KEY = 'refreshToken='

function extractRefreshTokenFromCookies(
	cookieHeader: string | undefined,
	refreshTokenCookie: { value?: unknown },
): string | undefined {
	if (cookieHeader) {
		const refreshTokens = cookieHeader
			.split(';')
			.map((cookie) => cookie.trim())
			.filter((cookie) => cookie.startsWith(REFRESH_TOKEN_COOKIE_KEY))
			.map((cookie) => cookie.slice(REFRESH_TOKEN_COOKIE_KEY.length))

		if (refreshTokens.length > 0) {
			return refreshTokens[refreshTokens.length - 1]
		}
	}

	if (typeof refreshTokenCookie.value === 'string') {
		return refreshTokenCookie.value
	}

	return undefined
}

export const refreshController = new Elysia().post(
	'/auth/refresh',
	async ({ cookie: { refreshToken: refreshTokenCookie }, set, headers, body }) => {
		let refreshTokenValue: string | undefined

		if (headers.authorization) {
			const [type, token] = headers.authorization.split(' ')
			if (type === 'Bearer' && token) {
				refreshTokenValue = token
			}
		}

		if (!refreshTokenValue && body && typeof body === 'object' && 'refreshToken' in body) {
			refreshTokenValue = (body as { refreshToken?: string }).refreshToken
		}

		if (!refreshTokenValue) {
			refreshTokenValue = extractRefreshTokenFromCookies(headers.cookie, refreshTokenCookie)
		}

		if (!refreshTokenValue) {
			throw new InvalidTokenError('Token de atualização não fornecido')
		}

		const tokens = await auth.refreshTokens.execute(refreshTokenValue)

		refreshTokenCookie.set({
			value: tokens.refreshToken,
			httpOnly: true,
			secure: env.NODE_ENV === 'production',
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60,
		})

		set.status = 200
		return {
			accessToken: tokens.accessToken,
		}
	},
	{
		response: refreshResponseSchema,
	},
)
