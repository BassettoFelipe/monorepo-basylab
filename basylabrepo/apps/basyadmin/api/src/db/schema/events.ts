import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const events = pgTable(
	'events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		eventName: varchar('event_name', { length: 100 }).notNull(),
		userId: varchar('user_id', { length: 255 }),
		properties: jsonb('properties').default({}),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => [
		index('idx_events_tenant_name').on(table.tenantId, table.eventName),
		index('idx_events_created_at').on(table.createdAt),
		index('idx_events_user').on(table.tenantId, table.userId),
	],
)

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
