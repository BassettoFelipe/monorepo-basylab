import { jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { tickets } from './tickets'

export const senderTypeEnum = pgEnum('sender_type', ['user', 'manager', 'owner', 'system'])

export const ticketMessages = pgTable('ticket_messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	ticketId: uuid('ticket_id')
		.notNull()
		.references(() => tickets.id, { onDelete: 'cascade' }),
	senderType: senderTypeEnum('sender_type').notNull(),
	senderId: varchar('sender_id', { length: 255 }),
	content: text('content').notNull(),
	attachments: jsonb('attachments').default([]),
	createdAt: timestamp('created_at').defaultNow(),
})

export type TicketMessage = typeof ticketMessages.$inferSelect
export type NewTicketMessage = typeof ticketMessages.$inferInsert
