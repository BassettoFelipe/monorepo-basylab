import { Elysia } from 'elysia'

interface AttemptRecord {
	count: number
	firstAttemptAt: number
	blockedUntil?: number
}

interface BruteForceConfig {
	maxAttempts: number
	windowMs: number
	blockDurationMs: number
}

interface BlockCheckResult {
	blocked: boolean
	reason?: string
	blockedUntil?: Date
	retryAt?: Date
}

export class BruteForceProtection {
	private ipAttempts: Map<string, AttemptRecord> = new Map()
	private identifierAttempts: Map<string, AttemptRecord> = new Map()
	private cleanupInterval: Timer

	constructor(private config: BruteForceConfig) {
		this.cleanupInterval = setInterval(
			() => {
				this.cleanup()
			},
			5 * 60 * 1000,
		)
	}

	private cleanup(): void {
		const now = Date.now()

		for (const [key, record] of this.ipAttempts.entries()) {
			if (
				record.blockedUntil &&
				record.blockedUntil < now &&
				now - record.firstAttemptAt > this.config.windowMs
			) {
				this.ipAttempts.delete(key)
			}
		}

		for (const [key, record] of this.identifierAttempts.entries()) {
			if (
				record.blockedUntil &&
				record.blockedUntil < now &&
				now - record.firstAttemptAt > this.config.windowMs
			) {
				this.identifierAttempts.delete(key)
			}
		}
	}

	private getOrCreateRecord(storage: Map<string, AttemptRecord>, key: string): AttemptRecord {
		const now = Date.now()
		const existing = storage.get(key)

		if (!existing) {
			const record: AttemptRecord = {
				count: 0,
				firstAttemptAt: now,
			}
			storage.set(key, record)
			return record
		}

		if (now - existing.firstAttemptAt > this.config.windowMs) {
			const record: AttemptRecord = {
				count: 0,
				firstAttemptAt: now,
			}
			storage.set(key, record)
			return record
		}

		return existing
	}

	private checkBlocked(record: AttemptRecord): BlockCheckResult {
		const now = Date.now()

		if (record.blockedUntil && record.blockedUntil > now) {
			return {
				blocked: true,
				reason: 'TOO_MANY_ATTEMPTS',
				blockedUntil: new Date(record.blockedUntil),
				retryAt: new Date(record.blockedUntil),
			}
		}

		if (record.blockedUntil && record.blockedUntil <= now) {
			record.blockedUntil = undefined
			record.count = 0
			record.firstAttemptAt = now
		}

		return { blocked: false }
	}

	/**
	 * Check if IP or identifier is blocked
	 */
	isBlocked(ip: string, identifier?: string): BlockCheckResult {
		const ipRecord = this.getOrCreateRecord(this.ipAttempts, ip)
		const ipCheck = this.checkBlocked(ipRecord)

		if (ipCheck.blocked) {
			return ipCheck
		}

		if (identifier) {
			const identifierRecord = this.getOrCreateRecord(this.identifierAttempts, identifier)
			const identifierCheck = this.checkBlocked(identifierRecord)

			if (identifierCheck.blocked) {
				return identifierCheck
			}
		}

		return { blocked: false }
	}

	/**
	 * Register a failed attempt
	 */
	registerFailedAttempt(ip: string, identifier?: string): void {
		const now = Date.now()

		const ipRecord = this.getOrCreateRecord(this.ipAttempts, ip)
		ipRecord.count++

		if (ipRecord.count >= this.config.maxAttempts) {
			ipRecord.blockedUntil = now + this.config.blockDurationMs
		}

		if (identifier) {
			const identifierRecord = this.getOrCreateRecord(this.identifierAttempts, identifier)
			identifierRecord.count++

			if (identifierRecord.count >= this.config.maxAttempts) {
				identifierRecord.blockedUntil = now + this.config.blockDurationMs
			}
		}
	}

	/**
	 * Register a successful attempt (clears tracking)
	 */
	registerSuccessfulAttempt(ip: string, identifier?: string): void {
		this.ipAttempts.delete(ip)
		if (identifier) {
			this.identifierAttempts.delete(identifier)
		}
	}

	/**
	 * Get remaining attempts before block
	 */
	getRemainingAttempts(ip: string, identifier?: string): number {
		const ipRecord = this.ipAttempts.get(ip)
		const identifierRecord = identifier ? this.identifierAttempts.get(identifier) : undefined

		const ipRemaining = ipRecord
			? Math.max(0, this.config.maxAttempts - ipRecord.count)
			: this.config.maxAttempts

		const identifierRemaining = identifierRecord
			? Math.max(0, this.config.maxAttempts - identifierRecord.count)
			: this.config.maxAttempts

		return Math.min(ipRemaining, identifierRemaining)
	}

	/**
	 * Clear all tracking
	 */
	clear(): void {
		this.ipAttempts.clear()
		this.identifierAttempts.clear()
	}

	/**
	 * Cleanup on shutdown
	 */
	destroy(): void {
		clearInterval(this.cleanupInterval)
		this.clear()
	}
}

export const bruteForceProtection = new BruteForceProtection({
	maxAttempts: 5,
	windowMs: 15 * 60 * 1000, // 15 minutes
	blockDurationMs: 30 * 60 * 1000, // 30 minutes
})

function getClientIp(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for')
	if (forwarded) {
		return forwarded.split(',')[0].trim()
	}

	const realIp = request.headers.get('x-real-ip')
	if (realIp) {
		return realIp
	}

	return 'unknown'
}

export const bruteForcePlugin = new Elysia({ name: 'brute-force' }).decorate('bruteForce', {
	protection: bruteForceProtection,
	getClientIp,
})
