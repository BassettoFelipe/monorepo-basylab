import { GetPlanUseCase } from '@/use-cases/plans/get-plan/get-plan.use-case'
import { ListPlansUseCase } from '@/use-cases/plans/list-plans/list-plans.use-case'
import { repositories } from './repositories'

export function createPlanUseCases() {
	return {
		listPlans: new ListPlansUseCase(repositories.planRepository),
		getPlan: new GetPlanUseCase(repositories.planRepository),
	}
}
