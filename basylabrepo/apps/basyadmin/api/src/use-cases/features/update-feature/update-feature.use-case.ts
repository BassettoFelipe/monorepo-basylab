import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Feature } from '@/db/schema'
import type { IFeatureRepository } from '@/repositories/contracts/feature.repository'

const logger = createLogger({ service: 'update-feature-use-case' })

type UpdateFeatureInput = {
	featureId: string
	name?: string
	slug?: string
	description?: string
	featureType?: 'boolean' | 'limit' | 'tier'
}

type UpdateFeatureOutput = Feature

export class UpdateFeatureUseCase {
	constructor(private readonly featureRepository: IFeatureRepository) {}

	async execute(input: UpdateFeatureInput): Promise<UpdateFeatureOutput> {
		const { featureId, name, slug, description, featureType } = input

		const feature = await this.featureRepository.findById(featureId)

		if (!feature) {
			throw new NotFoundError('Feature não encontrada')
		}

		if (slug && slug !== feature.slug) {
			const normalizedSlug = slug.toLowerCase().trim()
			const existingFeature = await this.featureRepository.findBySlug(normalizedSlug)
			if (existingFeature) {
				throw new ConflictError('Slug já está em uso')
			}
		}

		try {
			const updateData: Record<string, unknown> = {}

			if (name !== undefined) updateData.name = name.trim()
			if (slug !== undefined) updateData.slug = slug.toLowerCase().trim()
			if (description !== undefined) updateData.description = description?.trim() || null
			if (featureType !== undefined) updateData.featureType = featureType

			const updatedFeature = await this.featureRepository.update(featureId, updateData)

			if (!updatedFeature) {
				throw new NotFoundError('Feature não encontrada')
			}

			logger.info({ featureId: updatedFeature.id }, 'Feature atualizada com sucesso')

			return updatedFeature
		} catch (error) {
			if (
				error instanceof BadRequestError ||
				error instanceof ConflictError ||
				error instanceof NotFoundError
			) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atualizar feature')
			throw new InternalServerError('Erro ao atualizar feature. Tente novamente.')
		}
	}
}
