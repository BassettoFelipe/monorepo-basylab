import { NotFoundError } from '@basylab/core/errors'
import type { Feature } from '@/db/schema'
import type { IFeatureRepository } from '@/repositories/contracts/feature.repository'

type GetFeatureInput = {
	featureId: string
}

type GetFeatureOutput = Feature

export class GetFeatureUseCase {
	constructor(private readonly featureRepository: IFeatureRepository) {}

	async execute(input: GetFeatureInput): Promise<GetFeatureOutput> {
		const { featureId } = input

		const feature = await this.featureRepository.findById(featureId)

		if (!feature) {
			throw new NotFoundError('Feature não encontrada')
		}

		return feature
	}
}
