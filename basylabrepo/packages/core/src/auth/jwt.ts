import { type JWTPayload, SignJWT, jwtVerify } from 'jose'

export interface TokenPayload extends JWTPayload {
	sub: string
	exp: number
	iat: number
	[key: string]: unknown
}

export interface JwtConfig {
	secret: string
	issuer?: string
	audience?: string
}

export interface TokenOptions {
	expiresIn: string | number
	additionalClaims?: Record<string, unknown>
}

/**
 * Parse expiration string to seconds
 * Supports: 30s, 15m, 1h, 7d
 */
function parseExpirationToSeconds(exp: string | number): number {
	if (typeof exp === 'number') {
		return exp
	}

	const match = exp.match(/^(\d+)([smhd])$/)
	if (!match) {
		throw new Error(`Invalid expiration format: ${exp}`)
	}

	const value = Number.parseInt(match[1]!, 10)
	const unit = match[2]!

	const multipliers: Record<string, number> = {
		s: 1,
		m: 60,
		h: 60 * 60,
		d: 24 * 60 * 60,
	}

	return value * (multipliers[unit] ?? 1)
}

/**
 * Create a JWT utility instance
 */
export function createJwtUtils(config: JwtConfig) {
	const secretKey = new TextEncoder().encode(config.secret)

	return {
		/**
		 * Generate a signed JWT token
		 */
		async sign(subject: string, options: TokenOptions): Promise<string> {
			const { expiresIn, additionalClaims = {} } = options
			const expirationSeconds = parseExpirationToSeconds(expiresIn)
			const nowSeconds = Math.floor(Date.now() / 1000)

			let builder = new SignJWT({ ...additionalClaims })
				.setProtectedHeader({ alg: 'HS256' })
				.setSubject(subject)
				.setIssuedAt(nowSeconds)
				.setExpirationTime(nowSeconds + expirationSeconds)

			if (config.issuer) {
				builder = builder.setIssuer(config.issuer)
			}

			if (config.audience) {
				builder = builder.setAudience(config.audience)
			}

			return builder.sign(secretKey)
		},

		/**
		 * Verify and decode a JWT token
		 */
		async verify(token: string): Promise<TokenPayload | null> {
			try {
				const { payload } = await jwtVerify(token, secretKey, {
					issuer: config.issuer,
					audience: config.audience,
				})

				// Check expiration
				const nowSeconds = Math.floor(Date.now() / 1000)
				if (payload.exp && payload.exp < nowSeconds) {
					return null
				}

				return payload as TokenPayload
			} catch {
				return null
			}
		},

		/**
		 * Decode a JWT token without verification (for debugging)
		 */
		decode(token: string): TokenPayload | null {
			try {
				const parts = token.split('.')
				if (parts.length !== 3) {
					return null
				}
				const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8'))
				return payload as TokenPayload
			} catch {
				return null
			}
		},

		/**
		 * Parse expiration string to seconds
		 */
		parseExpirationToSeconds,
	}
}

export type JwtUtils = ReturnType<typeof createJwtUtils>
