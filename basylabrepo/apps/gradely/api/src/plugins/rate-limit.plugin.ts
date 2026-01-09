import { Elysia } from 'elysia'
import { TooManyRequestsError } from '@/errors/http-error'

type RateLimitEntry = {
	count: number
	resetAt: number
}

type RateLimitOptions = {
	windowMs: number
	maxRequests: number
	keyGenerator?: (request: Request) => string
}

const store = new Map<string, RateLimitEntry>()

const cleanupExpiredEntries = () => {
	const now = Date.now()
	for (const [key, entry] of store.entries()) {
		if (entry.resetAt <= now) {
			store.delete(key)
		}
	}
}

setInterval(cleanupExpiredEntries, 60_000)

const getClientIp = (request: Request): string => {
	const forwardedFor = request.headers.get('x-forwarded-for')
	if (forwardedFor) {
		return forwardedFor.split(',')[0]?.trim() ?? 'unknown'
	}

	const realIp = request.headers.get('x-real-ip')
	if (realIp) {
		return realIp
	}

	return 'unknown'
}

export const createRateLimiter = (options: RateLimitOptions) => {
	const { windowMs, maxRequests, keyGenerator } = options

	return new Elysia({ name: `rate-limiter-${windowMs}-${maxRequests}` }).derive(
		{ as: 'scoped' },
		({ request }) => {
			const key = keyGenerator ? keyGenerator(request) : getClientIp(request)
			const now = Date.now()

			let entry = store.get(key)

			if (!entry || entry.resetAt <= now) {
				entry = { count: 1, resetAt: now + windowMs }
				store.set(key, entry)
				return {}
			}

			entry.count++

			if (entry.count > maxRequests) {
				const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
				throw new TooManyRequestsError(
					`Muitas requisições. Tente novamente em ${retryAfterSeconds} segundos.`,
					{ retryAfter: retryAfterSeconds },
				)
			}

			return {}
		},
	)
}

export const authRateLimiter = createRateLimiter({
	windowMs: 60_000,
	maxRequests: 10,
})

export const loginRateLimiter = createRateLimiter({
	windowMs: 60_000,
	maxRequests: 5,
})
