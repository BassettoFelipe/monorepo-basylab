import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { users } from './users'

/**
 * Tipos de entidade que podem ter documentos
 */
export const DOCUMENT_ENTITY_TYPES = {
	PROPERTY_OWNER: 'property_owner',
	TENANT: 'tenant',
	CONTRACT: 'contract',
} as const

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[keyof typeof DOCUMENT_ENTITY_TYPES]

/**
 * Tipos de documento suportados
 */
export const DOCUMENT_TYPES = {
	RG: 'rg',
	CPF: 'cpf',
	CNPJ: 'cnpj',
	COMPROVANTE_RESIDENCIA: 'comprovante_residencia',
	COMPROVANTE_RENDA: 'comprovante_renda',
	CONTRATO_SOCIAL: 'contrato_social',
	PROCURACAO: 'procuracao',
	CONTRATO_LOCACAO: 'contrato_locacao',
	TERMO_VISTORIA: 'termo_vistoria',
	LAUDO_AVALIACAO: 'laudo_avaliacao',
	OUTROS: 'outros',
} as const

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES]

export const documents = pgTable(
	'documents',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		companyId: uuid('company_id')
			.notNull()
			.references(() => companies.id, { onDelete: 'cascade' }),
		entityType: text('entity_type').notNull(), // 'property_owner' ou 'tenant'
		entityId: uuid('entity_id').notNull(), // ID do proprietario ou inquilino
		documentType: text('document_type').notNull(), // Tipo de documento (rg, cpf, comprovante_renda, etc)
		filename: text('filename').notNull(), // Nome do arquivo no storage
		originalName: text('original_name').notNull(), // Nome original do arquivo
		mimeType: text('mime_type').notNull(), // Tipo do arquivo (application/pdf, image/jpeg, etc)
		size: integer('size').notNull(), // Tamanho em bytes
		url: text('url').notNull(), // URL para acessar o arquivo
		description: text('description'), // Descricao opcional
		uploadedBy: uuid('uploaded_by')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [
		index('documents_company_id_idx').on(table.companyId),
		index('documents_entity_type_entity_id_idx').on(table.entityType, table.entityId),
		index('documents_document_type_idx').on(table.documentType),
	],
)

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
