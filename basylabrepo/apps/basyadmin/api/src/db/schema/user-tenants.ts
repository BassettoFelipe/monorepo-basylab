import { jsonb, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'

export const userTenants = pgTable(
	'user_tenants',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		permissions: jsonb('permissions').default({ read: true, write: true }),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.tenantId] })],
)

export type UserTenant = typeof userTenants.$inferSelect
export type NewUserTenant = typeof userTenants.$inferInsert
