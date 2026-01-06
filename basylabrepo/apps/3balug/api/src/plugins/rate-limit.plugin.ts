import { Elysia } from 'elysia'
import { env } from '@/config/env'

interface RateLimitConfig {
	windowMs: number
	maxRequests: number
	message?: string
	skipSuccessfulRequests?: boolean
}

interface RequestRecord {
	count: number
	resetTime: number
}

class RateLimiter {
	private requests = new Map<string, RequestRecord>()
	private cleanupInterval: Timer | null = null

	constructor(private config: RateLimitConfig) {
		this.cleanupInterval = setInterval(() => {
			this.cleanup()
		}, 60000)
	}

	check(ip: string): {
		allowed: boolean
		resetTime: number
		remaining: number
	} {
		const now = Date.now()
		const record = this.requests.get(ip)

		if (!record || now >= record.resetTime) {
			const resetTime = now + this.config.windowMs
			this.requests.set(ip, { count: 1, resetTime })

			return {
				allowed: true,
				resetTime,
				remaining: this.config.maxRequests - 1,
			}
		}

		record.count++

		if (record.count > this.config.maxRequests) {
			return {
				allowed: false,
				resetTime: record.resetTime,
				remaining: 0,
			}
		}

		return {
			allowed: true,
			resetTime: record.resetTime,
			remaining: this.config.maxRequests - record.count,
		}
	}

	private cleanup() {
		const now = Date.now()
		for (const [ip, record] of this.requests.entries()) {
			if (now >= record.resetTime) {
				this.requests.delete(ip)
			}
		}
	}

	clear() {
		this.requests.clear()
	}

	destroy() {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval)
			this.cleanupInterval = null
		}
		this.requests.clear()
	}
}

export function createRateLimitPlugin(config: RateLimitConfig) {
	const limiter = new RateLimiter(config)
	const message = config.message || 'Muitas requisições. Tente novamente mais tarde.'

	return new Elysia({ name: 'rate-limit' })
		.onBeforeHandle({ as: 'global' }, ({ request, set }) => {
			if (env.NODE_ENV === 'test') {
				return
			}

			const ip =
				request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
				request.headers.get('x-real-ip') ||
				'unknown'

			const result = limiter.check(ip)

			set.headers['X-RateLimit-Limit'] = config.maxRequests.toString()
			set.headers['X-RateLimit-Remaining'] = result.remaining.toString()
			set.headers['X-RateLimit-Reset'] = new Date(result.resetTime).toISOString()

			if (!result.allowed) {
				set.status = 429
				const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
				set.headers['Retry-After'] = retryAfter.toString()

				return {
					error: message,
					code: 429,
					type: 'TOO_MANY_REQUESTS',
					retryAfter,
				}
			}
		})
		.onStop(() => {
			limiter.destroy()
		})
}

export const rateLimitPlugin = createRateLimitPlugin({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 100,
	message: 'Você excedeu o limite de requisições. Por favor, aguarde alguns minutos.',
})

export const authRateLimitPlugin = createRateLimitPlugin({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 30,
	message:
		'Muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.',
})

export const apiRateLimitPlugin = createRateLimitPlugin({
	windowMs: 5 * 60 * 1000, // 5 minutes
	maxRequests: 50,
	message: 'Muitas requisições. Por favor, aguarde alguns minutos antes de tentar novamente.',
})

export const verificationRateLimitPlugin = createRateLimitPlugin({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 100,
	message:
		'Muitas tentativas de verificação. Por favor, aguarde alguns minutos antes de tentar novamente.',
})

export const resendRateLimitPlugin = createRateLimitPlugin({
	windowMs: 5 * 60 * 1000, // 5 minutes
	maxRequests: 30,
	message: 'Muitas tentativas de reenvio de código. Por favor, aguarde alguns minutos.',
})

export const loginRateLimitPlugin = createRateLimitPlugin({
	windowMs: 1 * 60 * 1000, // 1 minute
	maxRequests: 5,
	message: 'Muitas tentativas de login. Por favor, aguarde 1 minuto antes de tentar novamente.',
})

export const passwordResetRateLimitPlugin = createRateLimitPlugin({
	windowMs: 5 * 60 * 1000, // 5 minutes
	maxRequests: 1,
	message: 'Você já solicitou a redefinição de senha. Por favor, aguarde 5 minutos.',
})

export const emailVerificationRateLimitPlugin = createRateLimitPlugin({
	windowMs: 2 * 60 * 1000, // 2 minutes
	maxRequests: 1,
	message: 'Você já solicitou o reenvio do código. Por favor, aguarde 2 minutos.',
})
