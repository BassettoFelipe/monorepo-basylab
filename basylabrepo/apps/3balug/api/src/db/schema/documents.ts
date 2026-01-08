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

/**
 * Limites de tamanho de arquivo por tipo de documento (em bytes)
 * - Documentos de identidade (RG, CPF, CNPJ): 2MB - sao geralmente fotos/scans simples
 * - Comprovantes (residencia, renda): 5MB - podem ter multiplas paginas
 * - Contratos e documentos juridicos: 10MB - podem ser extensos
 * - Outros: 5MB - limite padrao
 */
export const DOCUMENT_SIZE_LIMITS: Record<DocumentType, number> = {
	rg: 2 * 1024 * 1024, // 2MB
	cpf: 2 * 1024 * 1024, // 2MB
	cnpj: 2 * 1024 * 1024, // 2MB
	comprovante_residencia: 5 * 1024 * 1024, // 5MB
	comprovante_renda: 5 * 1024 * 1024, // 5MB
	contrato_social: 10 * 1024 * 1024, // 10MB
	procuracao: 5 * 1024 * 1024, // 5MB
	contrato_locacao: 10 * 1024 * 1024, // 10MB
	termo_vistoria: 10 * 1024 * 1024, // 10MB
	laudo_avaliacao: 10 * 1024 * 1024, // 10MB
	outros: 5 * 1024 * 1024, // 5MB
}

/**
 * Retorna o limite em MB formatado
 */
export function getDocumentSizeLimitMB(documentType: DocumentType): number {
	return DOCUMENT_SIZE_LIMITS[documentType] / (1024 * 1024)
}

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
		// Soft delete fields
		deletedAt: timestamp('deleted_at'), // Data de exclusao (null = ativo)
		deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }), // Quem excluiu
	},
	(table) => [
		index('documents_company_id_idx').on(table.companyId),
		index('documents_entity_type_entity_id_idx').on(table.entityType, table.entityId),
		index('documents_document_type_idx').on(table.documentType),
		index('documents_deleted_at_idx').on(table.deletedAt),
	],
)

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
