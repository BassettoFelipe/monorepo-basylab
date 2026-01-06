import postgres from 'postgres'
import { env } from '@/config/env'
import { logger } from '@/config/logger'

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 1000

async function waitForDatabase() {
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL not configured')
	}

	let retries = 0

	while (retries < MAX_RETRIES) {
		try {
			const sql = postgres(env.DATABASE_URL, { max: 1 })

			await sql`SELECT 1 as connected`
			await sql.end({ timeout: 0 })

			logger.info('Database is ready')
			return true
		} catch (error) {
			retries++

			if (retries >= MAX_RETRIES) {
				logger.error(`Database not ready after ${MAX_RETRIES} attempts`)
				throw error
			}

			logger.info(`Waiting for database... (attempt ${retries}/${MAX_RETRIES})`)

			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
		}
	}

	return false
}

waitForDatabase().catch((error) => {
	logger.error({ error }, 'Failed to connect to database')
	process.exit(1)
})
