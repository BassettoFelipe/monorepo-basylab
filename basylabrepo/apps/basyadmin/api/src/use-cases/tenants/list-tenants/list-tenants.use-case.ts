import type { Tenant } from '@/db/schema'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

type ListTenantsInput = {
	userRole: 'owner' | 'manager'
	userId: string
	search?: string
	limit?: number
	offset?: number
}

type ListTenantsOutput = {
	data: Tenant[]
	total: number
	limit: number
	offset: number
}

export class ListTenantsUseCase {
	constructor(private readonly tenantRepository: ITenantRepository) {}

	async execute(input: ListTenantsInput): Promise<ListTenantsOutput> {
		const { userRole, userId, search, limit = 20, offset = 0 } = input

		if (userRole === 'owner') {
			return await this.tenantRepository.list({ search, limit, offset })
		}

		// Manager só vê os tenants que gerencia
		const managerTenants = await this.tenantRepository.findByManagerId(userId)

		let filteredTenants = managerTenants

		if (search) {
			const searchLower = search.toLowerCase()
			filteredTenants = managerTenants.filter(
				(t) =>
					t.name.toLowerCase().includes(searchLower) || t.slug.toLowerCase().includes(searchLower),
			)
		}

		const total = filteredTenants.length
		const data = filteredTenants.slice(offset, offset + limit)

		return {
			data,
			total,
			limit,
			offset,
		}
	}
}
