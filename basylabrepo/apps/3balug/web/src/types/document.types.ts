export const DOCUMENT_ENTITY_TYPES = {
	PROPERTY_OWNER: 'property_owner',
	TENANT: 'tenant',
	CONTRACT: 'contract',
} as const

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[keyof typeof DOCUMENT_ENTITY_TYPES]

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

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
	rg: 'RG',
	cpf: 'CPF',
	cnpj: 'CNPJ',
	comprovante_residencia: 'Comprovante de Residencia',
	comprovante_renda: 'Comprovante de Renda',
	contrato_social: 'Contrato Social',
	procuracao: 'Procuracao',
	contrato_locacao: 'Contrato de Locacao',
	termo_vistoria: 'Termo de Vistoria',
	laudo_avaliacao: 'Laudo de Avaliacao',
	outros: 'Outros',
}

export interface Document {
	id: string
	entityType: DocumentEntityType
	entityId: string
	documentType: DocumentType
	filename: string
	originalName: string
	mimeType: string
	size: number
	url: string
	description: string | null
	createdAt: string
}

export interface UploadedFile {
	url: string
	key: string
	fileName: string
	size: number
	contentType: string
}

export interface ListDocumentsResponse {
	success: boolean
	data: Document[]
	total: number
}

export interface UploadDocumentResponse {
	success: boolean
	message: string
	data: Document
}

export interface DeleteDocumentResponse {
	success: boolean
	message: string
}
