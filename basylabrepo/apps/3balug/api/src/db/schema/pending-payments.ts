import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { plans } from './plans'

export const pendingPayments = pgTable('pending_payments', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull(),
	password: text('password').notNull(),
	name: text('name').notNull(),
	planId: uuid('plan_id')
		.notNull()
		.references(() => plans.id, { onDelete: 'restrict' }),
	pagarmeOrderId: text('pagarme_order_id'),
	pagarmeChargeId: text('pagarme_charge_id'),
	status: text('status').notNull().default('pending'),
	processedWebhookId: text('processed_webhook_id'),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type PendingPayment = typeof pendingPayments.$inferSelect
export type NewPendingPayment = typeof pendingPayments.$inferInsert
