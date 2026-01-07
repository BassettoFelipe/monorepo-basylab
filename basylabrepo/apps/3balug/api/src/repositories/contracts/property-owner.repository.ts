import type { NewPropertyOwner, PropertyOwner } from '@/db/schema/property-owners'

export type PropertyOwnerFilters = {
	search?: string // Busca por nome, email ou documento
	companyId: string
	createdBy?: string // Filtrar por quem criou
	documentType?: string // Filtrar por tipo de documento (cpf ou cnpj)
	state?: string // Filtrar por estado
	hasProperties?: boolean // Filtrar por ter ou não imóveis
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
