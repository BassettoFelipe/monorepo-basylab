import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 100 }).notNull(),
	slug: varchar('slug', { length: 50 }).unique().notNull(),
	logoUrl: text('logo_url'),
	domain: varchar('domain', { length: 255 }),
	description: text('description'),
	apiKey: varchar('api_key', { length: 64 }).unique().notNull(),
	apiKeyCreatedAt: timestamp('api_key_created_at').defaultNow(),
	settings: jsonb('settings').default({}),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
})

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
