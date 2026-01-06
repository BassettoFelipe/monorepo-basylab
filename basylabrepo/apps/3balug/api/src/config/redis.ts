import Redis from 'ioredis'
import { Constants } from './constants'
import { env } from './env'
import { logger } from './logger'

const isTestEnv = process.env.BUN_TESTING === '1' || process.env.NODE_ENV === 'test'

let redisClient: Redis | null = null

/**
 * Get Redis client instance (singleton)
 * In test environment, returns a mock Redis client
 */
export function getRedis(): Redis {
	if (isTestEnv) {
		if (!redisClient) {
			logger.debug('Creating mock Redis client for test environment')
			const mockRedis = new Redis({
				lazyConnect: true,
				maxRetriesPerRequest: 0,
			})
			redisClient = mockRedis
		}
		return redisClient
	}

	if (!redisClient) {
		logger.debug(
			{
				host: env.REDIS_HOST,
				port: env.REDIS_PORT,
				db: env.REDIS_DB,
			},
			'Creating Redis client',
		)

		redisClient = new Redis({
			host: env.REDIS_HOST,
			port: env.REDIS_PORT,
			password: env.REDIS_PASSWORD || undefined,
			db: env.REDIS_DB,
			retryStrategy: (times) => {
				const delay = Math.min(times * 50, 2000)
				logger.debug({ times, delay }, 'Redis retry attempt')
				return delay
			},
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
			lazyConnect: false,
			connectTimeout: Constants.TIMEOUTS.REDIS_CONNECT_MS,
			commandTimeout: Constants.TIMEOUTS.REDIS_COMMAND_MS,
		})

		redisClient.on('connect', () => {
			logger.info('Redis connected')
		})

		redisClient.on('error', (err) => {
			logger.error({ err }, 'Redis connection error')
		})

		redisClient.on('ready', () => {
			logger.info('Redis ready')
		})

		redisClient.on('close', () => {
			logger.warn('Redis connection closed')
		})

		redisClient.on('reconnecting', () => {
			logger.info('Redis reconnecting')
		})
	}

	return redisClient
}

/**
 * Close Redis connection (useful for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
	if (redisClient) {
		await redisClient.quit()
		redisClient = null
		logger.info('Redis connection closed')
	}
}

export type RedisClient = Redis
