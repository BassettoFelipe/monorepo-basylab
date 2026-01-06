import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { Constants } from '@/config/constants'
import * as schema from './schema'

const isTestEnv = process.env.NODE_ENV === 'test'
const isProdEnv = process.env.NODE_ENV === 'production'

const databaseUrl = isTestEnv
	? process.env.TEST_DATABASE_URL ||
		'postgresql://crm_imobil:crm_imobil123@localhost:5435/crm_imobil_test'
	: process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5434/crm_imobil'

const client = postgres(databaseUrl, {
	max: isTestEnv
		? Constants.DATABASE.POOL_SIZE_TEST
		: isProdEnv
			? Constants.DATABASE.POOL_SIZE_PROD
			: Constants.DATABASE.POOL_SIZE_DEV,
	idle_timeout: Constants.DATABASE.IDLE_TIMEOUT_S,
	connect_timeout: Constants.TIMEOUTS.DATABASE_CONNECT_S,
	max_lifetime: Constants.DATABASE.MAX_LIFETIME_S,
	prepare: true,
	transform: undefined,
	onnotice: () => undefined,
})

export const db = drizzle(client, { schema })

export type Database = typeof db

export { client, schema }

/**
 * Close database connection pool (for graceful shutdown)
 */
export async function closeDatabase(): Promise<void> {
	await client.end()
}
