import { NotFoundError } from '@basylab/core/errors'
import type { Tenant } from '@/db/schema'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

type GetTenantInput = {
	tenantId: string
	userRole: 'owner' | 'manager'
	userId: string
}

type GetTenantOutput = Tenant

export class GetTenantUseCase {
	constructor(private readonly tenantRepository: ITenantRepository) {}

	async execute(input: GetTenantInput): Promise<GetTenantOutput> {
		const { tenantId, userRole, userId } = input

		const tenant = await this.tenantRepository.findById(tenantId)

		if (!tenant) {
			throw new NotFoundError('Tenant não encontrado')
		}

		if (userRole !== 'owner') {
			const hasAccess = await this.tenantRepository.isManagerOfTenant(userId, tenantId)
			if (!hasAccess) {
				throw new NotFoundError('Tenant não encontrado')
			}
		}

		return tenant
	}
}
