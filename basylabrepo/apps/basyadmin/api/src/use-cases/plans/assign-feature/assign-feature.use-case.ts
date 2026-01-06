import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { IFeatureRepository } from '@/repositories/contracts/feature.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'

const logger = createLogger({ service: 'assign-feature-use-case' })

type AssignFeatureInput = {
	planId: string
	tenantId: string
	featureId: string
	value?: unknown
}

type AssignFeatureOutput = {
	success: boolean
}

export class AssignFeatureUseCase {
	constructor(
		private readonly planRepository: IPlanRepository,
		private readonly featureRepository: IFeatureRepository,
	) {}

	async execute(input: AssignFeatureInput): Promise<AssignFeatureOutput> {
		const { planId, tenantId, featureId, value } = input

		const plan = await this.planRepository.findById(planId)

		if (!plan || plan.tenantId !== tenantId) {
			throw new NotFoundError('Plano não encontrado')
		}

		const feature = await this.featureRepository.findById(featureId)

		if (!feature) {
			throw new NotFoundError('Feature não encontrada')
		}

		try {
			await this.planRepository.assignFeature(planId, featureId, value)

			logger.info(
				{ planId, featureId, featureSlug: feature.slug },
				'Feature atribuída ao plano com sucesso',
			)

			return { success: true }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atribuir feature ao plano')
			throw new InternalServerError('Erro ao atribuir feature ao plano. Tente novamente.')
		}
	}
}
