import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'

export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent'])
export const ticketStatusEnum = pgEnum('ticket_status', [
	'open',
	'in_progress',
	'waiting',
	'resolved',
	'closed',
])

export const tickets = pgTable(
	'tickets',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		externalUserId: varchar('external_user_id', { length: 255 }),
		externalUserEmail: varchar('external_user_email', { length: 255 }),
		title: varchar('title', { length: 255 }).notNull(),
		description: text('description'),
		priority: ticketPriorityEnum('priority').default('medium'),
		status: ticketStatusEnum('status').default('open'),
		category: varchar('category', { length: 50 }),
		metadata: jsonb('metadata').default({}),
		assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
		resolvedAt: timestamp('resolved_at'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		index('idx_tickets_tenant').on(table.tenantId),
		index('idx_tickets_status').on(table.status),
		index('idx_tickets_assigned').on(table.assignedTo),
	],
)

export type Ticket = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert
