import type { NewTenant, Tenant } from '@/db/schema'

export type TenantFilters = {
	search?: string
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
	findBySlug(slug: string): Promise<Tenant | null>
	findByApiKey(apiKey: string): Promise<Tenant | null>
	findAll(): Promise<Tenant[]>
	findByManagerId(managerId: string): Promise<Tenant[]>
	list(filters: TenantFilters): Promise<TenantListResult>
	create(data: NewTenant): Promise<Tenant>
	update(id: string, data: Partial<NewTenant>): Promise<Tenant | null>
	delete(id: string): Promise<boolean>
	assignManager(tenantId: string, managerId: string): Promise<void>
	removeManager(tenantId: string, managerId: string): Promise<void>
	isManagerOfTenant(managerId: string, tenantId: string): Promise<boolean>
}
