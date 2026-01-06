import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { IFeatureRepository } from '@/repositories/contracts/feature.repository'

const logger = createLogger({ service: 'delete-feature-use-case' })

type DeleteFeatureInput = {
	featureId: string
}

type DeleteFeatureOutput = {
	success: boolean
}

export class DeleteFeatureUseCase {
	constructor(private readonly featureRepository: IFeatureRepository) {}

	async execute(input: DeleteFeatureInput): Promise<DeleteFeatureOutput> {
		const { featureId } = input

		const feature = await this.featureRepository.findById(featureId)

		if (!feature) {
			throw new NotFoundError('Feature não encontrada')
		}

		try {
			const deleted = await this.featureRepository.delete(featureId)

			if (!deleted) {
				throw new NotFoundError('Feature não encontrada')
			}

			logger.info({ featureId, slug: feature.slug }, 'Feature deletada com sucesso')

			return { success: true }
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao deletar feature')
			throw new InternalServerError('Erro ao deletar feature. Tente novamente.')
		}
	}
}
