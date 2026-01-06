import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const plans = pgTable('plans', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description'),
	price: integer('price').notNull(),
	durationDays: integer('duration_days').notNull().default(30),
	maxUsers: integer('max_users'), // null = ilimitado
	maxManagers: integer('max_managers').notNull().default(0),
	maxSerasaQueries: integer('max_serasa_queries').notNull(),
	allowsLateCharges: integer('allows_late_charges').notNull().default(0),
	features: jsonb('features').$type<string[]>().notNull().default([]),
	pagarmePlanId: text('pagarme_plan_id'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Plan = typeof plans.$inferSelect
export type NewPlan = typeof plans.$inferInsert
