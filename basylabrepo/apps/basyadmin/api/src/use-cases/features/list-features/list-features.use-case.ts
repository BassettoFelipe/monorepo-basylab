import type { Feature } from '@/db/schema'
import type { IFeatureRepository } from '@/repositories/contracts/feature.repository'

type ListFeaturesInput = {
	search?: string
	featureType?: 'boolean' | 'limit' | 'tier'
	limit?: number
	offset?: number
}

type ListFeaturesOutput = {
	data: Feature[]
	total: number
	limit: number
	offset: number
}

export class ListFeaturesUseCase {
	constructor(private readonly featureRepository: IFeatureRepository) {}

	async execute(input: ListFeaturesInput): Promise<ListFeaturesOutput> {
		const { search, featureType, limit = 20, offset = 0 } = input

		return await this.featureRepository.list({
			search,
			featureType,
			limit,
			offset,
		})
	}
}
