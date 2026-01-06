import type { NewTenant, Tenant } from '@/db/schema/tenants'

export type TenantFilters = {
	search?: string // Busca por nome, email ou CPF
	companyId: string
	createdBy?: string // Filtrar por quem criou
	limit?: number
	offset?: number
}

export type TenantListResult = {
	data: Tenant[]
	total: number
	limit: number
	offset: number
}

export interface ITenantRepository {
	findById(id: string): Promise<Tenant | null>
	findByCpf(cpf: string, companyId: string): Promise<Tenant | null>
	findByDocument(document: string, companyId: string): Promise<{ id: string } | null>
	findByEmail(email: string, companyId: string): Promise<Tenant | null>
	findByCompanyId(companyId: string): Promise<Tenant[]>
	list(filters: TenantFilters): Promise<TenantListResult>
	create(data: NewTenant): Promise<Tenant>
	update(id: string, data: Partial<NewTenant>): Promise<Tenant | null>
	delete(id: string): Promise<boolean>
	countByCompanyId(companyId: string): Promise<number>
}
