import Elysia from 'elysia'
import { env } from '../config/env'
import { logger } from '../config/logger'

interface DevDelayConfig {
	minDelay: number
	maxDelay: number
	enabled: boolean
}

const defaultConfig: DevDelayConfig = {
	minDelay: 100,
	maxDelay: 2000,
	enabled: env.NODE_ENV === 'development',
}

function getRandomDelay(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export const devDelayPlugin = (config: Partial<DevDelayConfig> = {}) => {
	const finalConfig = { ...defaultConfig, ...config }

	if (!finalConfig.enabled) {
		return new Elysia({ name: 'dev-delay' })
	}

	return new Elysia({ name: 'dev-delay' }).onBeforeHandle({ as: 'global' }, async ({ request }) => {
		const delay = getRandomDelay(finalConfig.minDelay, finalConfig.maxDelay)
		const path = new URL(request.url).pathname

		logger.debug(
			{
				path,
				delay,
				method: request.method,
			},
			`[DEV] Simulating production latency: ${delay}ms`,
		)

		await sleep(delay)
	})
}
