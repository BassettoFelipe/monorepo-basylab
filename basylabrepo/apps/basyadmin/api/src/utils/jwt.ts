import { createJwtUtils } from '@basylab/core/auth'
import { env } from '../config'

const jwtUtils = createJwtUtils({
	secret: env.JWT_SECRET,
	issuer: 'basyadmin',
})

export type TokenPayload = {
	userId: string
	email: string
	role: 'owner' | 'manager'
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
	return jwtUtils.sign(payload.userId, {
		expiresIn: env.JWT_ACCESS_EXPIRES_IN,
		additionalClaims: {
			email: payload.email,
			role: payload.role,
		},
	})
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
	return jwtUtils.sign(payload.userId, {
		expiresIn: env.JWT_REFRESH_EXPIRES_IN,
		additionalClaims: {
			email: payload.email,
			role: payload.role,
		},
	})
}

export async function verifyToken(token: string): Promise<TokenPayload> {
	const decoded = await jwtUtils.verify(token)

	if (!decoded) {
		throw new Error('Invalid token')
	}

	return {
		userId: decoded.sub,
		email: decoded.email as string,
		role: decoded.role as 'owner' | 'manager',
	}
}
