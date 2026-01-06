import type { PgColumn } from 'drizzle-orm/pg-core'
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const companies = pgTable('companies', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	cnpj: text('cnpj').unique(),
	ownerId: uuid('owner_id').references((): PgColumn => users.id, {
		onDelete: 'restrict',
	}),
	email: text('email'),
	phone: text('phone'),
	address: text('address'),
	city: text('city'),
	state: text('state'),
	zipCode: text('zip_code'),
	settings: jsonb('settings')
		.$type<{
			logo?: string
			primaryColor?: string
			timezone?: string
			locale?: string
			notifications?: {
				email?: boolean
				sms?: boolean
				whatsapp?: boolean
			}
		}>()
		.default({}),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
