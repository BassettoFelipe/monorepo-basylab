import { createJwtUtils, type TokenPayload } from '@basylab/core/auth'
import { env } from '@/config/env'

export type TokenType = 'access' | 'refresh'

export interface JwtPayload extends TokenPayload {
	role?: string
}

interface JwtTokenConfig {
	secret: string
	expiresIn: string
}

function getTokenConfig(type: TokenType): JwtTokenConfig {
	const configs: Record<TokenType, JwtTokenConfig> = {
		access: {
			secret: env.JWT_ACCESS_SECRET,
			expiresIn: env.JWT_ACCESS_EXPIRES_IN,
		},
		refresh: {
			secret: env.JWT_REFRESH_SECRET,
			expiresIn: env.JWT_REFRESH_EXPIRES_IN,
		},
	}

	return configs[type]
}

const jwtInstances = new Map<TokenType, ReturnType<typeof createJwtUtils>>()

function getJwtInstance(type: TokenType) {
	let instance = jwtInstances.get(type)
	if (!instance) {
		const config = getTokenConfig(type)
		instance = createJwtUtils({
			secret: config.secret,
			issuer: 'gradely',
		})
		jwtInstances.set(type, instance)
	}
	return instance
}

function parseExpirationToSeconds(exp: string): number {
	const match = exp.match(/^(\d+)([smhd])$/)
	if (!match?.[1] || !match[2]) {
		throw new Error(`Invalid expiration format: ${exp}`)
	}

	const value = Number.parseInt(match[1], 10)
	const unit = match[2]

	const multipliers: Record<string, number> = {
		s: 1,
		m: 60,
		h: 60 * 60,
		d: 24 * 60 * 60,
	}

	return value * (multipliers[unit] ?? 1)
}

export const JwtUtils = {
	async generateToken(
		userId: string,
		type: TokenType,
		additionalPayload?: Record<string, unknown>,
	): Promise<string> {
		const config = getTokenConfig(type)
		const jwtInstance = getJwtInstance(type)

		return jwtInstance.sign(userId, {
			expiresIn: config.expiresIn,
			additionalClaims: additionalPayload,
		})
	},

	async verifyToken(token: string, type: TokenType): Promise<JwtPayload | null> {
		const jwtInstance = getJwtInstance(type)
		const payload = await jwtInstance.verify(token)

		if (!payload) {
			return null
		}

		return payload as JwtPayload
	},

	getExpirationSeconds(type: TokenType): number {
		const config = getTokenConfig(type)
		return parseExpirationToSeconds(config.expiresIn)
	},

	parseExpirationToSeconds,
}
