import { NotFoundError } from '@basylab/core/errors'
import type { IPlanRepository, PlanWithFeatures } from '@/repositories/contracts/plan.repository'

type GetPlanInput = {
	planId: string
	tenantId: string
}

type GetPlanOutput = PlanWithFeatures

export class GetPlanUseCase {
	constructor(private readonly planRepository: IPlanRepository) {}

	async execute(input: GetPlanInput): Promise<GetPlanOutput> {
		const { planId, tenantId } = input

		const plan = await this.planRepository.findByIdWithFeatures(planId)

		if (!plan || plan.tenantId !== tenantId) {
			throw new NotFoundError('Plano não encontrado')
		}

		return plan
	}
}
