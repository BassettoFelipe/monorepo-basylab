import {
	AuthenticationRequiredError,
	InvalidTokenError,
	TokenExpiredError,
} from '@basylab/core/errors'
import { Elysia } from 'elysia'
import { type JwtPayload, JwtUtils } from '@/utils/jwt.utils'
import { TokenBlacklist } from '@/utils/token-blacklist'

export interface AuthContext {
	userId: string
	userRole: string | null
	tokenPayload: JwtPayload
	[key: string]: unknown
}

function extractBearerToken(authorization: string | undefined): string | null {
	if (!authorization) {
		return null
	}

	const parts = authorization.split(' ')
	if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
		return null
	}

	return parts[1]
}

function createAuthContext(payload: JwtPayload): AuthContext {
	return {
		userId: payload.sub,
		userRole: payload.role ?? null,
		tokenPayload: payload,
	}
}

export const requireAuth = new Elysia({ name: 'auth-middleware' }).derive(
	{ as: 'scoped' },
	async ({ headers }): Promise<AuthContext> => {
		const token = extractBearerToken(headers.authorization)

		if (!token) {
			if (!headers.authorization) {
				throw new AuthenticationRequiredError()
			}
			throw new InvalidTokenError('Token de autenticação inválido')
		}

		if (TokenBlacklist.isBlacklisted(token)) {
			throw new InvalidTokenError('Token foi revogado')
		}

		const payload = await JwtUtils.verifyToken(token, 'access')

		if (!payload) {
			throw new TokenExpiredError('Sua sessão expirou. Por favor, faça login novamente')
		}

		return createAuthContext(payload)
	},
)
