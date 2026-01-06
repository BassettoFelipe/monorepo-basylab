import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'

const logger = createLogger({ service: 'delete-plan-use-case' })

type DeletePlanInput = {
	planId: string
	tenantId: string
}

type DeletePlanOutput = {
	success: boolean
}

export class DeletePlanUseCase {
	constructor(private readonly planRepository: IPlanRepository) {}

	async execute(input: DeletePlanInput): Promise<DeletePlanOutput> {
		const { planId, tenantId } = input

		const plan = await this.planRepository.findById(planId)

		if (!plan || plan.tenantId !== tenantId) {
			throw new NotFoundError('Plano não encontrado')
		}

		try {
			const deleted = await this.planRepository.delete(planId)

			if (!deleted) {
				throw new NotFoundError('Plano não encontrado')
			}

			logger.info({ planId, tenantId, slug: plan.slug }, 'Plano deletado com sucesso')

			return { success: true }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao deletar plano')
			throw new InternalServerError('Erro ao deletar plano. Tente novamente.')
		}
	}
}
