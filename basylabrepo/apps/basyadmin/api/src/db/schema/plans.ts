import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const billingIntervalEnum = pgEnum('billing_interval', ['monthly', 'yearly'])

export const plans = pgTable(
	'plans',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 100 }).notNull(),
		slug: varchar('slug', { length: 50 }).notNull(),
		description: text('description'),
		priceCents: integer('price_cents').notNull(),
		currency: varchar('currency', { length: 3 }).default('BRL'),
		billingInterval: billingIntervalEnum('billing_interval').default('monthly'),
		isActive: boolean('is_active').default(true),
		displayOrder: integer('display_order').default(0),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [unique().on(table.tenantId, table.slug)],
)

export type Plan = typeof plans.$inferSelect
export type NewPlan = typeof plans.$inferInsert
