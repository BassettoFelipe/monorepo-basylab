import type { BillingRecord } from '@/db/schema'
import type { IBillingRepository } from '@/repositories/contracts/billing.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

type ListBillingRecordsInput = {
	userRole: 'owner' | 'manager'
	userId: string
	tenantId?: string
	status?: 'paid' | 'pending' | 'failed' | 'refunded'
	startDate?: Date
	endDate?: Date
	limit?: number
	offset?: number
}

type ListBillingRecordsOutput = {
	data: BillingRecord[]
	total: number
	limit: number
	offset: number
}

export class ListBillingRecordsUseCase {
	constructor(
		private readonly billingRepository: IBillingRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: ListBillingRecordsInput): Promise<ListBillingRecordsOutput> {
		const {
			userRole,
			userId,
			tenantId,
			status,
			startDate,
			endDate,
			limit = 100,
			offset = 0,
		} = input

		if (tenantId && userRole !== 'owner') {
			const hasAccess = await this.tenantRepository.isManagerOfTenant(userId, tenantId)
			if (!hasAccess) {
				return { data: [], total: 0, limit, offset }
			}
		}

		return await this.billingRepository.findByFilters({
			tenantId,
			status,
			startDate,
			endDate,
			limit,
			offset,
		})
	}
}
