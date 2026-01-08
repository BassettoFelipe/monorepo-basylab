export type DocumentType = 'cpf' | 'cnpj'

export type MaritalStatus = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel'

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
	solteiro: 'Solteiro(a)',
	casado: 'Casado(a)',
	divorciado: 'Divorciado(a)',
	viuvo: 'Viuvo(a)',
	uniao_estavel: 'Uniao Estavel',
}

export interface PropertyOwner {
	id: string
	name: string
	documentType: DocumentType
	document: string
	rg: string | null
	nationality: string | null
	maritalStatus: MaritalStatus | null
	profession: string | null
	email: string | null
	phone: string | null
	phoneSecondary: string | null
	address: string | null
	addressNumber: string | null
	addressComplement: string | null
	neighborhood: string | null
	city: string | null
	state: string | null
	zipCode: string | null
	birthDate: string | null
	photoUrl: string | null
	notes: string | null
	createdAt: string
	updatedAt: string
}

export interface CreatePropertyOwnerInput {
	name: string
	documentType: DocumentType
	document: string
	rg?: string
	nationality?: string
	maritalStatus?: MaritalStatus
	profession?: string
	email?: string
	phone?: string
	phoneSecondary?: string
	address?: string
	addressNumber?: string
	addressComplement?: string
	neighborhood?: string
	city?: string
	state?: string
	zipCode?: string
	birthDate?: string
	photoUrl?: string
	notes?: string
}

export interface UpdatePropertyOwnerInput {
	name?: string
	documentType?: DocumentType
	document?: string
	rg?: string | null
	nationality?: string | null
	maritalStatus?: MaritalStatus | null
	profession?: string | null
	email?: string | null
	phone?: string | null
	phoneSecondary?: string | null
	address?: string | null
	addressNumber?: string | null
	addressComplement?: string | null
	neighborhood?: string | null
	city?: string | null
	state?: string | null
	zipCode?: string | null
	birthDate?: string | null
	photoUrl?: string | null
	notes?: string | null
}

export interface ListPropertyOwnersParams {
	search?: string
	page?: number
	limit?: number
}

export interface ListPropertyOwnersApiResponse {
	data: PropertyOwner[]
	total: number
	limit: number
	offset: number
}

export interface ListPropertyOwnersResponse {
	data: PropertyOwner[]
	total: number
	page: number
	limit: number
	totalPages: number
}
