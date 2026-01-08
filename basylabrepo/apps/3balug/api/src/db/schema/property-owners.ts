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
		rg: text('rg'), // RG (apenas para PF)
		nationality: text('nationality'), // Nacionalidade
		maritalStatus: text('marital_status'), // Estado civil
		profession: text('profession'), // Profissao
		email: text('email'),
		phone: text('phone'),
		phoneSecondary: text('phone_secondary'), // Telefone secundario/WhatsApp
		address: text('address'),
		addressNumber: text('address_number'), // Numero
		addressComplement: text('address_complement'), // Complemento
		neighborhood: text('neighborhood'), // Bairro
		city: text('city'),
		state: text('state'),
		zipCode: text('zip_code'),
		birthDate: text('birth_date'), // Data de nascimento (para PF)
		photoUrl: text('photo_url'), // URL da foto do proprietário
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
