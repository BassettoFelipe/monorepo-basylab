import { BadRequestError, ConflictError, InternalServerError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Feature } from '@/db/schema'
import type { IFeatureRepository } from '@/repositories/contracts/feature.repository'

const logger = createLogger({ service: 'create-feature-use-case' })

type CreateFeatureInput = {
	name: string
	slug: string
	description?: string
	featureType?: 'boolean' | 'limit' | 'tier'
}

type CreateFeatureOutput = Feature

export class CreateFeatureUseCase {
	constructor(private readonly featureRepository: IFeatureRepository) {}

	async execute(input: CreateFeatureInput): Promise<CreateFeatureOutput> {
		const { name, slug, description, featureType } = input

		if (!name || name.trim().length === 0) {
			throw new BadRequestError('Nome é obrigatório')
		}

		if (!slug || slug.trim().length === 0) {
			throw new BadRequestError('Slug é obrigatório')
		}

		const normalizedSlug = slug.toLowerCase().trim()

		const existingFeature = await this.featureRepository.findBySlug(normalizedSlug)
		if (existingFeature) {
			throw new ConflictError('Slug já está em uso')
		}

		try {
			const feature = await this.featureRepository.create({
				name: name.trim(),
				slug: normalizedSlug,
				description: description?.trim() || null,
				featureType: featureType || 'boolean',
			})

			logger.info({ featureId: feature.id, slug: feature.slug }, 'Feature criada com sucesso')

			return feature
		} catch (error) {
			if (error instanceof BadRequestError || error instanceof ConflictError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar feature')
			throw new InternalServerError('Erro ao criar feature. Tente novamente.')
		}
	}
}
