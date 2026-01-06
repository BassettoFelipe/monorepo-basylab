import { AssignFeatureUseCase } from '@/use-cases/plans/assign-feature/assign-feature.use-case'
import { CreatePlanUseCase } from '@/use-cases/plans/create-plan/create-plan.use-case'
import { DeletePlanUseCase } from '@/use-cases/plans/delete-plan/delete-plan.use-case'
import { GetPlanUseCase } from '@/use-cases/plans/get-plan/get-plan.use-case'
import { ListPlansUseCase } from '@/use-cases/plans/list-plans/list-plans.use-case'
import { RemoveFeatureUseCase } from '@/use-cases/plans/remove-feature/remove-feature.use-case'
import { UpdatePlanUseCase } from '@/use-cases/plans/update-plan/update-plan.use-case'
import { repositories } from './repositories'

export function createPlanUseCases() {
	return {
		create: new CreatePlanUseCase(repositories.planRepository, repositories.tenantRepository),
		list: new ListPlansUseCase(repositories.planRepository),
		get: new GetPlanUseCase(repositories.planRepository),
		update: new UpdatePlanUseCase(repositories.planRepository),
		delete: new DeletePlanUseCase(repositories.planRepository),
		assignFeature: new AssignFeatureUseCase(
			repositories.planRepository,
			repositories.featureRepository,
		),
		removeFeature: new RemoveFeatureUseCase(repositories.planRepository),
	}
}
