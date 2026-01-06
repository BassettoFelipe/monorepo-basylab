import { beforeEach, describe, expect, it } from 'bun:test'
import { ConflictError, NotFoundError } from '@basylab/core/errors'
import { InMemoryFeatureRepository } from '@/test/in-memory-repositories'
import { createTestFeature } from '@/test/test-helpers'
import { CreateFeatureUseCase } from '../create-feature/create-feature.use-case'
import { DeleteFeatureUseCase } from '../delete-feature/delete-feature.use-case'
import { GetFeatureUseCase } from '../get-feature/get-feature.use-case'
import { ListFeaturesUseCase } from '../list-features/list-features.use-case'
import { UpdateFeatureUseCase } from '../update-feature/update-feature.use-case'

describe('Feature Use Cases', () => {
	let featureRepository: InMemoryFeatureRepository

	beforeEach(() => {
		featureRepository = new InMemoryFeatureRepository()
	})

	describe('CreateFeatureUseCase', () => {
		it('should create a feature successfully', async () => {
			const useCase = new CreateFeatureUseCase(featureRepository)

			const result = await useCase.execute({
				name: 'Test Feature',
				slug: 'test-feature',
				description: 'A test feature',
				featureType: 'boolean',
			})

			expect(result.id).toBeDefined()
			expect(result.name).toBe('Test Feature')
			expect(result.slug).toBe('test-feature')
			expect(result.featureType).toBe('boolean')
		})

		it('should normalize slug to lowercase', async () => {
			const useCase = new CreateFeatureUseCase(featureRepository)

			const result = await useCase.execute({
				name: 'Test Feature',
				slug: 'TEST-FEATURE',
			})

			expect(result.slug).toBe('test-feature')
		})

		it('should throw ConflictError when slug already exists', async () => {
			const existingFeature = createTestFeature({ slug: 'existing-slug' })
			featureRepository.seed([existingFeature])

			const useCase = new CreateFeatureUseCase(featureRepository)

			await expect(
				useCase.execute({
					name: 'Test Feature',
					slug: 'existing-slug',
				}),
			).rejects.toThrow(ConflictError)
		})

		it('should create feature with limit type', async () => {
			const useCase = new CreateFeatureUseCase(featureRepository)

			const result = await useCase.execute({
				name: 'Users Limit',
				slug: 'users-limit',
				featureType: 'limit',
			})

			expect(result.featureType).toBe('limit')
		})

		it('should create feature with tier type', async () => {
			const useCase = new CreateFeatureUseCase(featureRepository)

			const result = await useCase.execute({
				name: 'Support Tier',
				slug: 'support-tier',
				featureType: 'tier',
			})

			expect(result.featureType).toBe('tier')
		})
	})

	describe('ListFeaturesUseCase', () => {
		it('should list all features', async () => {
			const feature1 = createTestFeature({ name: 'Feature 1', slug: 'feature-1' })
			const feature2 = createTestFeature({ name: 'Feature 2', slug: 'feature-2' })
			featureRepository.seed([feature1, feature2])

			const useCase = new ListFeaturesUseCase(featureRepository)

			const result = await useCase.execute({})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(2)
		})

		it('should filter features by search', async () => {
			const feature1 = createTestFeature({ name: 'Alpha Feature', slug: 'alpha' })
			const feature2 = createTestFeature({ name: 'Beta Feature', slug: 'beta' })
			featureRepository.seed([feature1, feature2])

			const useCase = new ListFeaturesUseCase(featureRepository)

			const result = await useCase.execute({
				search: 'alpha',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Alpha Feature')
		})

		it('should filter features by type', async () => {
			const booleanFeature = createTestFeature({
				name: 'Boolean Feature',
				slug: 'boolean',
				featureType: 'boolean',
			})
			const limitFeature = createTestFeature({
				name: 'Limit Feature',
				slug: 'limit',
				featureType: 'limit',
			})
			featureRepository.seed([booleanFeature, limitFeature])

			const useCase = new ListFeaturesUseCase(featureRepository)

			const result = await useCase.execute({
				featureType: 'limit',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].featureType).toBe('limit')
		})

		it('should apply pagination', async () => {
			const features = Array.from({ length: 5 }, (_, i) =>
				createTestFeature({ name: `Feature ${i}`, slug: `feature-${i}` }),
			)
			featureRepository.seed(features)

			const useCase = new ListFeaturesUseCase(featureRepository)

			const result = await useCase.execute({
				limit: 2,
				offset: 0,
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(5)
		})
	})

	describe('GetFeatureUseCase', () => {
		it('should get feature by id', async () => {
			const feature = createTestFeature({ name: 'Test Feature' })
			featureRepository.seed([feature])

			const useCase = new GetFeatureUseCase(featureRepository)

			const result = await useCase.execute({
				featureId: feature.id,
			})

			expect(result.id).toBe(feature.id)
			expect(result.name).toBe('Test Feature')
		})

		it('should throw NotFoundError when feature does not exist', async () => {
			const useCase = new GetFeatureUseCase(featureRepository)

			await expect(
				useCase.execute({
					featureId: 'non-existent-id',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('UpdateFeatureUseCase', () => {
		it('should update feature successfully', async () => {
			const feature = createTestFeature({ name: 'Old Name' })
			featureRepository.seed([feature])

			const useCase = new UpdateFeatureUseCase(featureRepository)

			const result = await useCase.execute({
				featureId: feature.id,
				name: 'New Name',
				description: 'New description',
			})

			expect(result.name).toBe('New Name')
			expect(result.description).toBe('New description')
		})

		it('should update slug when different', async () => {
			const feature = createTestFeature({ slug: 'old-slug' })
			featureRepository.seed([feature])

			const useCase = new UpdateFeatureUseCase(featureRepository)

			const result = await useCase.execute({
				featureId: feature.id,
				slug: 'new-slug',
			})

			expect(result.slug).toBe('new-slug')
		})

		it('should throw NotFoundError when feature does not exist', async () => {
			const useCase = new UpdateFeatureUseCase(featureRepository)

			await expect(
				useCase.execute({
					featureId: 'non-existent-id',
					name: 'New Name',
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw ConflictError when new slug already exists', async () => {
			const feature1 = createTestFeature({ slug: 'feature-1' })
			const feature2 = createTestFeature({ slug: 'feature-2' })
			featureRepository.seed([feature1, feature2])

			const useCase = new UpdateFeatureUseCase(featureRepository)

			await expect(
				useCase.execute({
					featureId: feature1.id,
					slug: 'feature-2',
				}),
			).rejects.toThrow(ConflictError)
		})
	})

	describe('DeleteFeatureUseCase', () => {
		it('should delete feature successfully', async () => {
			const feature = createTestFeature()
			featureRepository.seed([feature])

			const useCase = new DeleteFeatureUseCase(featureRepository)

			const result = await useCase.execute({
				featureId: feature.id,
			})

			expect(result.success).toBe(true)

			const deletedFeature = await featureRepository.findById(feature.id)
			expect(deletedFeature).toBeNull()
		})

		it('should throw NotFoundError when feature does not exist', async () => {
			const useCase = new DeleteFeatureUseCase(featureRepository)

			await expect(
				useCase.execute({
					featureId: 'non-existent-id',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})
})
