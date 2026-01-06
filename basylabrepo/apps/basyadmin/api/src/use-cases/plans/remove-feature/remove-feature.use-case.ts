import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'

const logger = createLogger({ service: 'remove-feature-use-case' })

type RemoveFeatureInput = {
	planId: string
	tenantId: string
	featureId: string
}

type RemoveFeatureOutput = {
	success: boolean
}

export class RemoveFeatureUseCase {
	constructor(private readonly planRepository: IPlanRepository) {}

	async execute(input: RemoveFeatureInput): Promise<RemoveFeatureOutput> {
		const { planId, tenantId, featureId } = input

		const plan = await this.planRepository.findById(planId)

		if (!plan || plan.tenantId !== tenantId) {
			throw new NotFoundError('Plano não encontrado')
		}

		try {
			await this.planRepository.removeFeature(planId, featureId)

			logger.info({ planId, featureId }, 'Feature removida do plano com sucesso')

			return { success: true }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao remover feature do plano')
			throw new InternalServerError('Erro ao remover feature do plano. Tente novamente.')
		}
	}
}
