import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { users } from './users'

export const tenants = pgTable(
	'tenants',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		cpf: text('cpf').notNull(), // CPF (apenas números)
		email: text('email'),
		phone: text('phone'),
		address: text('address'),
		city: text('city'),
		state: text('state'),
		zipCode: text('zip_code'),
		birthDate: text('birth_date'), // Data de nascimento
		monthlyIncome: integer('monthly_income'), // Renda mensal em centavos
		employer: text('employer'), // Empregador/Empresa onde trabalha
		emergencyContact: text('emergency_contact'), // Nome do contato de emergência
		emergencyPhone: text('emergency_phone'), // Telefone do contato de emergência
		rg: text('rg'), // RG do inquilino
		nationality: text('nationality'), // Nacionalidade
		maritalStatus: text('marital_status'), // Estado civil
		profession: text('profession'), // Profissão
		photoUrl: text('photo_url'), // URL da foto do inquilino
		notes: text('notes'),
		createdBy: uuid('created_by')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		index('tenants_company_id_idx').on(table.companyId),
		index('tenants_cpf_idx').on(table.cpf),
		index('tenants_created_by_idx').on(table.createdBy),
		index('tenants_company_created_idx').on(table.companyId, table.createdAt),
	],
)

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
