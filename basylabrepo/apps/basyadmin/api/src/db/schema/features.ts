import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const featureTypeEnum = pgEnum('feature_type', ['boolean', 'limit', 'tier'])

export const features = pgTable('features', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 100 }).notNull(),
	slug: varchar('slug', { length: 50 }).unique().notNull(),
	description: text('description'),
	featureType: featureTypeEnum('feature_type').default('boolean'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
})

export type Feature = typeof features.$inferSelect
export type NewFeature = typeof features.$inferInsert
