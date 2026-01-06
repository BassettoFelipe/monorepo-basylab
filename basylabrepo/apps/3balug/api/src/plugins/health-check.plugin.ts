import { Elysia } from 'elysia'
import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { getRedis } from '@/config/redis'
import { db } from '@/db'

export const healthCheckPlugin = () => {
	return new Elysia({ name: 'health-check' }).get('/health', async () => {
		const checks = {
			status: 'healthy',
			timestamp: new Date().toISOString(),
			environment: env.NODE_ENV,
			project: '3Balug',
			version: process.env.APP_VERSION || '1.0.0',
			services: {
				database: { status: 'unknown', latency: 0 },
				redis: { status: 'unknown', latency: 0 },
			},
		}

		try {
			const dbStart = Date.now()
			const timeoutMs = 5000

			await Promise.race([
				db.execute('SELECT 1'),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Database health check timeout')), timeoutMs),
				),
			])

			checks.services.database = {
				status: 'healthy',
				latency: Date.now() - dbStart,
			}
		} catch (error) {
			checks.status = 'unhealthy'
			checks.services.database = { status: 'unhealthy', latency: 0 }
			logger.error({
				msg: 'Health check failed for database',
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}

		try {
			const redis = getRedis()
			const redisStart = Date.now()
			const timeoutMs = 5000

			await Promise.race([
				redis.ping(),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Redis health check timeout')), timeoutMs),
				),
			])

			checks.services.redis = {
				status: 'healthy',
				latency: Date.now() - redisStart,
			}
		} catch (error) {
			checks.status = 'unhealthy'
			checks.services.redis = { status: 'unhealthy', latency: 0 }
			logger.error({
				msg: 'Health check failed for redis',
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}

		return checks
	})
}
