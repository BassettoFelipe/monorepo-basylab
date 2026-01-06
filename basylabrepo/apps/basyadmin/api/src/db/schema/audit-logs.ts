import { index, inet, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

export const auditLogs = pgTable(
	'audit_logs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
		action: varchar('action', { length: 100 }).notNull(),
		entityType: varchar('entity_type', { length: 50 }),
		entityId: uuid('entity_id'),
		oldValues: jsonb('old_values'),
		newValues: jsonb('new_values'),
		ipAddress: inet('ip_address'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => [
		index('idx_audit_user').on(table.userId),
		index('idx_audit_entity').on(table.entityType, table.entityId),
		index('idx_audit_created').on(table.createdAt),
	],
)

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
