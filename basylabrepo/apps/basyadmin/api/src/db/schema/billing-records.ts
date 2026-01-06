import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const billingStatusEnum = pgEnum('billing_status', ['paid', 'pending', 'failed', 'refunded'])

export const billingRecords = pgTable(
	'billing_records',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		externalCustomerId: varchar('external_customer_id', { length: 255 }),
		customerEmail: varchar('customer_email', { length: 255 }),
		planSlug: varchar('plan_slug', { length: 50 }),
		amountCents: integer('amount_cents').notNull(),
		currency: varchar('currency', { length: 3 }).default('BRL'),
		status: billingStatusEnum('status').notNull(),
		paidAt: timestamp('paid_at'),
		metadata: jsonb('metadata').default({}),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => [
		index('idx_billing_tenant').on(table.tenantId),
		index('idx_billing_status').on(table.status),
		index('idx_billing_paid_at').on(table.paidAt),
	],
)

export type BillingRecord = typeof billingRecords.$inferSelect
export type NewBillingRecord = typeof billingRecords.$inferInsert
