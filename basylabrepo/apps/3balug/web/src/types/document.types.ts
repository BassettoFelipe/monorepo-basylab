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
 * Retorna o limite de tamanho formatado para exibicao
 */
export function getDocumentSizeLimitLabel(documentType: DocumentType): string {
	const sizeInBytes = DOCUMENT_SIZE_LIMITS[documentType]
	const sizeInMB = sizeInBytes / (1024 * 1024)
	return `${sizeInMB}MB`
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
