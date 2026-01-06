import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { users } from './users'

export const propertyOwners = pgTable(
	'property_owners',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		documentType: text('document_type').notNull().default('cpf'), // cpf ou cnpj
		document: text('document').notNull(), // CPF ou CNPJ (apenas números)
		email: text('email'),
		phone: text('phone'),
		address: text('address'),
		city: text('city'),
		state: text('state'),
		zipCode: text('zip_code'),
		birthDate: text('birth_date'), // Data de nascimento (para PF)
		notes: text('notes'),
		createdBy: uuid('created_by')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('property_owners_company_id_idx').on(table.companyId),
		index('property_owners_document_idx').on(table.document),
		index('property_owners_created_by_idx').on(table.createdBy),
		index('property_owners_company_created_idx').on(table.companyId, table.createdAt),
	],
)

export type PropertyOwner = typeof propertyOwners.$inferSelect
export type NewPropertyOwner = typeof propertyOwners.$inferInsert
