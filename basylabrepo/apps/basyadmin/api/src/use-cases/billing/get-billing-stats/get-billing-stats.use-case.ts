import type { BillingStats, IBillingRepository } from '@/repositories/contracts/billing.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

type GetBillingStatsInput = {
	userRole: 'owner' | 'manager'
	userId: string
	tenantId?: string
	startDate?: Date
	endDate?: Date
}

type GetBillingStatsOutput = BillingStats & {
	mrr: number
	arr: number
}

export class GetBillingStatsUseCase {
	constructor(
		private readonly billingRepository: IBillingRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: GetBillingStatsInput): Promise<GetBillingStatsOutput> {
		const { userRole, userId, tenantId, startDate, endDate } = input

		if (tenantId && userRole !== 'owner') {
			const hasAccess = await this.tenantRepository.isManagerOfTenant(userId, tenantId)
			if (!hasAccess) {
				return {
					totalRevenue: 0,
					totalTransactions: 0,
					paidTransactions: 0,
					failedTransactions: 0,
					mrr: 0,
					arr: 0,
				}
			}
		}

		const [stats, mrr] = await Promise.all([
			this.billingRepository.getStats(tenantId, startDate, endDate),
			this.billingRepository.getMRR(tenantId),
		])

		return {
			...stats,
			mrr,
			arr: mrr * 12,
		}
	}
}
