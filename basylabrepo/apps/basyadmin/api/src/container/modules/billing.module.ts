import { CreateBillingRecordUseCase } from '@/use-cases/billing/create-billing-record/create-billing-record.use-case'
import { GetBillingStatsUseCase } from '@/use-cases/billing/get-billing-stats/get-billing-stats.use-case'
import { ListBillingRecordsUseCase } from '@/use-cases/billing/list-billing-records/list-billing-records.use-case'
import { repositories } from './repositories'

export function createBillingUseCases() {
	return {
		create: new CreateBillingRecordUseCase(repositories.billingRepository),
		list: new ListBillingRecordsUseCase(
			repositories.billingRepository,
			repositories.tenantRepository,
		),
		getStats: new GetBillingStatsUseCase(
			repositories.billingRepository,
			repositories.tenantRepository,
		),
	}
}
