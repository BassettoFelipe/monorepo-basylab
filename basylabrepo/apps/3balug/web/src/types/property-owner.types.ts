export type DocumentType = 'cpf' | 'cnpj'

export interface PropertyOwner {
	id: string
	name: string
	documentType: DocumentType
	document: string
	email: string | null
	phone: string | null
	address: string | null
	city: string | null
	state: string | null
	zipCode: string | null
	birthDate: string | null
	notes: string | null
	createdAt: string
	updatedAt: string
}

export interface CreatePropertyOwnerInput {
	name: string
	documentType: DocumentType
	document: string
	email?: string
	phone?: string
	address?: string
	city?: string
	state?: string
	zipCode?: string
	birthDate?: string
	notes?: string
}

export interface UpdatePropertyOwnerInput {
	name?: string
	documentType?: DocumentType
	document?: string
	email?: string | null
	phone?: string | null
	address?: string | null
	city?: string | null
	state?: string | null
	zipCode?: string | null
	birthDate?: string | null
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
