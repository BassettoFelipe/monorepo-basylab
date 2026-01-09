import { env } from '@/config/env'
import { logger } from '@/config/logger'
import type { User } from '@/db/schema/users'
import type { CurrentSubscription } from '@/repositories/contracts/subscription.repository'
import type { ICacheService } from '../contracts/cache.interface'

export interface CachedUserState {
	user: {
		id: string
		email: string
		name: string
		role: string
		phone: string | null
		companyId: string | null
		createdBy: string | null
		isActive: boolean
		isEmailVerified: boolean
	}
	subscription: {
		id: string
		userId: string
		status: string
		computedStatus: string
		planId: string
		startDate: string | null
		endDate: string | null
		daysRemaining: number | null
		plan: {
			id: string
			name: string
			price: number
			features: string[]
		}
	} | null
	cachedAt: number
}

export interface IUserCacheService {
	get(userId: string): Promise<CachedUserState | null>
	set(userId: string, user: User, subscription: CurrentSubscription | null): Promise<void>
	invalidate(userId: string): Promise<void>
	invalidateMany(userIds: string[]): Promise<void>
	invalidateAll(): Promise<void>
	getStats(): Promise<{ totalKeys: number; memoryUsage: string }>
}

export class UserCacheService implements IUserCacheService {
	private readonly prefix = 'user_state:'
	private readonly ttl = env.REDIS_CACHE_TTL

	constructor(private readonly cacheService: ICacheService) {}

	private getCacheKey(userId: string): string {
		return `${this.prefix}${userId}`
	}

	async get(userId: string): Promise<CachedUserState | null> {
		try {
			const cached = await this.cacheService.get<CachedUserState>(this.getCacheKey(userId))

			if (!cached) {
				return null
			}

			const age = Date.now() - cached.cachedAt
			if (age > this.ttl * 1000) {
				await this.invalidate(userId)
				return null
			}

			return cached
		} catch (error) {
			logger.error({ error, userId }, 'Error reading user cache')
			return null
		}
	}

	async set(userId: string, user: User, subscription: CurrentSubscription | null): Promise<void> {
		try {
			const cacheData: CachedUserState = {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
					phone: user.phone,
					companyId: user.companyId,
					createdBy: user.createdBy,
					isActive: user.isActive,
					isEmailVerified: user.isEmailVerified,
				},
				subscription: subscription
					? {
							id: subscription.id,
							userId: subscription.userId,
							status: subscription.status,
							computedStatus: subscription.computedStatus,
							planId: subscription.planId,
							startDate: subscription.startDate?.toISOString() || null,
							endDate: subscription.endDate?.toISOString() || null,
							daysRemaining: subscription.daysRemaining,
							plan: subscription.plan,
						}
					: null,
				cachedAt: Date.now(),
			}

			await this.cacheService.set(this.getCacheKey(userId), cacheData, this.ttl)

			logger.debug({ userId, ttl: this.ttl }, 'User state cached')
		} catch (error) {
			logger.error({ error, userId }, 'Error writing user cache')
		}
	}

	async invalidate(userId: string): Promise<void> {
		try {
			await this.cacheService.delete(this.getCacheKey(userId))
			logger.debug({ userId }, 'User cache invalidated')
		} catch (error) {
			logger.error({ error, userId }, 'Error invalidating user cache')
		}
	}

	async invalidateMany(userIds: string[]): Promise<void> {
		if (userIds.length === 0) return

		try {
			const keys = userIds.map((id) => this.getCacheKey(id))
			await this.cacheService.deleteMany(keys)
			logger.debug({ count: userIds.length }, 'Multiple user caches invalidated')
		} catch (error) {
			logger.error({ error, count: userIds.length }, 'Error invalidating multiple caches')
		}
	}

	async invalidateAll(): Promise<void> {
		try {
			const count = await this.cacheService.deleteByPattern(`${this.prefix}*`)
			logger.info({ count }, 'All user caches invalidated')
		} catch (error) {
			logger.error({ error }, 'Error invalidating all caches')
		}
	}

	async getStats(): Promise<{ totalKeys: number; memoryUsage: string }> {
		return this.cacheService.getStats()
	}
}
