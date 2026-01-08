import type { NewPropertyOwner, PropertyOwner } from '@/db/schema/property-owners'

export type PropertyOwnerSortBy = 'name' | 'createdAt' | 'propertiesCount' | 'city' | 'state'
export type PropertyOwnerSortOrder = 'asc' | 'desc'

export type PropertyOwnerFilters = {
	search?: string // Busca por nome, email, documento, telefone ou cidade
	companyId: string
	createdBy?: string // Filtrar por quem criou
	documentType?: 'cpf' | 'cnpj' // Filtrar por tipo de documento
	state?: string // Filtrar por estado
	city?: string // Filtrar por cidade
	hasProperties?: boolean // Filtrar por ter ou não imóveis
	hasEmail?: boolean // Filtrar por ter ou não email
	hasPhone?: boolean // Filtrar por ter ou não telefone
	createdAtStart?: Date // Filtrar por data de criação (início)
	createdAtEnd?: Date // Filtrar por data de criação (fim)
	sortBy?: PropertyOwnerSortBy // Campo para ordenação
	sortOrder?: PropertyOwnerSortOrder // Direção da ordenação
	limit?: number
	offset?: number
}

export type PropertyOwnerWithPropertiesCount = PropertyOwner & {
	propertiesCount: number
}

export type PropertyOwnerListResult = {
	data: PropertyOwnerWithPropertiesCount[]
	total: number
	limit: number
	offset: number
}

export interface IPropertyOwnerRepository {
	findById(id: string): Promise<PropertyOwner | null>
	findByIdWithDetails(id: string): Promise<PropertyOwnerWithPropertiesCount | null>
	findByDocument(document: string, companyId: string): Promise<PropertyOwner | null>
	findByEmail(email: string, companyId: string): Promise<PropertyOwner | null>
	findByCompanyId(companyId: string): Promise<PropertyOwner[]>
	list(filters: PropertyOwnerFilters): Promise<PropertyOwnerListResult>
	create(data: NewPropertyOwner): Promise<PropertyOwner>
	update(id: string, data: Partial<NewPropertyOwner>): Promise<PropertyOwner | null>
	delete(id: string): Promise<boolean>
	countByCompanyId(companyId: string): Promise<number>
}
