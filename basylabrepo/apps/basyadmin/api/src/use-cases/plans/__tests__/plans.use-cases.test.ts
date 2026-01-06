import { beforeEach, describe, expect, it } from 'bun:test'
import { ConflictError, NotFoundError } from '@basylab/core/errors'
import {
	InMemoryFeatureRepository,
	InMemoryPlanRepository,
	InMemoryTenantRepository,
} from '@/test/in-memory-repositories'
import { createTestFeature, createTestPlan, createTestTenant } from '@/test/test-helpers'
import { AssignFeatureUseCase } from '../assign-feature/assign-feature.use-case'
import { CreatePlanUseCase } from '../create-plan/create-plan.use-case'
import { DeletePlanUseCase } from '../delete-plan/delete-plan.use-case'
import { GetPlanUseCase } from '../get-plan/get-plan.use-case'
import { ListPlansUseCase } from '../list-plans/list-plans.use-case'
import { RemoveFeatureUseCase } from '../remove-feature/remove-feature.use-case'
import { UpdatePlanUseCase } from '../update-plan/update-plan.use-case'

describe('Plan Use Cases', () => {
	let planRepository: InMemoryPlanRepository
	let tenantRepository: InMemoryTenantRepository
	let featureRepository: InMemoryFeatureRepository
	let tenant: ReturnType<typeof createTestTenant>

	beforeEach(() => {
		planRepository = new InMemoryPlanRepository()
		tenantRepository = new InMemoryTenantRepository()
		featureRepository = new InMemoryFeatureRepository()
		planRepository.setFeatureRepository(featureRepository)

		tenant = createTestTenant()
		tenantRepository.seed([tenant])
	})

	describe('CreatePlanUseCase', () => {
		it('should create a plan successfully', async () => {
			const useCase = new CreatePlanUseCase(planRepository, tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				name: 'Test Plan',
				slug: 'test-plan',
				priceCents: 9900,
				description: 'A test plan',
			})

			expect(result.id).toBeDefined()
			expect(result.name).toBe('Test Plan')
			expect(result.slug).toBe('test-plan')
			expect(result.priceCents).toBe(9900)
			expect(result.tenantId).toBe(tenant.id)
		})

		it('should normalize slug to lowercase', async () => {
			const useCase = new CreatePlanUseCase(planRepository, tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				name: 'Test Plan',
				slug: 'TEST-PLAN',
				priceCents: 9900,
			})

			expect(result.slug).toBe('test-plan')
		})

		it('should throw NotFoundError when tenant does not exist', async () => {
			const useCase = new CreatePlanUseCase(planRepository, tenantRepository)

			await expect(
				useCase.execute({
					tenantId: 'non-existent-tenant',
					name: 'Test Plan',
					slug: 'test-plan',
					priceCents: 9900,
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw ConflictError when slug already exists for tenant', async () => {
			const existingPlan = createTestPlan(tenant.id, { slug: 'existing-slug' })
			planRepository.seed([existingPlan])

			const useCase = new CreatePlanUseCase(planRepository, tenantRepository)

			await expect(
				useCase.execute({
					tenantId: tenant.id,
					name: 'Test Plan',
					slug: 'existing-slug',
					priceCents: 9900,
				}),
			).rejects.toThrow(ConflictError)
		})

		it('should allow same slug for different tenants', async () => {
			const tenant2 = createTestTenant({ slug: 'tenant-2' })
			tenantRepository.seed([tenant2])

			const plan1 = createTestPlan(tenant.id, { slug: 'same-slug' })
			planRepository.seed([plan1])

			const useCase = new CreatePlanUseCase(planRepository, tenantRepository)

			const result = await useCase.execute({
				tenantId: tenant2.id,
				name: 'Test Plan',
				slug: 'same-slug',
				priceCents: 9900,
			})

			expect(result.slug).toBe('same-slug')
			expect(result.tenantId).toBe(tenant2.id)
		})
	})

	describe('ListPlansUseCase', () => {
		it('should list all plans for a tenant', async () => {
			const plan1 = createTestPlan(tenant.id, { name: 'Plan 1', slug: 'plan-1' })
			const plan2 = createTestPlan(tenant.id, { name: 'Plan 2', slug: 'plan-2' })
			planRepository.seed([plan1, plan2])

			const useCase = new ListPlansUseCase(planRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
			})

			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(2)
		})

		it('should filter plans by search', async () => {
			const plan1 = createTestPlan(tenant.id, { name: 'Basic Plan', slug: 'basic' })
			const plan2 = createTestPlan(tenant.id, { name: 'Pro Plan', slug: 'pro' })
			planRepository.seed([plan1, plan2])

			const useCase = new ListPlansUseCase(planRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				search: 'basic',
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Basic Plan')
		})

		it('should filter plans by isActive', async () => {
			const activePlan = createTestPlan(tenant.id, {
				name: 'Active',
				slug: 'active',
				isActive: true,
			})
			const inactivePlan = createTestPlan(tenant.id, {
				name: 'Inactive',
				slug: 'inactive',
				isActive: false,
			})
			planRepository.seed([activePlan, inactivePlan])

			const useCase = new ListPlansUseCase(planRepository)

			const result = await useCase.execute({
				tenantId: tenant.id,
				isActive: true,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Active')
		})
	})

	describe('GetPlanUseCase', () => {
		it('should get plan by id', async () => {
			const plan = createTestPlan(tenant.id, { name: 'Test Plan' })
			planRepository.seed([plan])

			const useCase = new GetPlanUseCase(planRepository)

			const result = await useCase.execute({
				planId: plan.id,
				tenantId: tenant.id,
			})

			expect(result.id).toBe(plan.id)
			expect(result.name).toBe('Test Plan')
		})

		it('should throw NotFoundError when plan does not exist', async () => {
			const useCase = new GetPlanUseCase(planRepository)

			await expect(
				useCase.execute({
					planId: 'non-existent-id',
					tenantId: tenant.id,
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw NotFoundError when plan belongs to different tenant', async () => {
			const plan = createTestPlan(tenant.id, { name: 'Test Plan' })
			planRepository.seed([plan])

			const useCase = new GetPlanUseCase(planRepository)

			await expect(
				useCase.execute({
					planId: plan.id,
					tenantId: 'different-tenant-id',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('UpdatePlanUseCase', () => {
		it('should update plan successfully', async () => {
			const plan = createTestPlan(tenant.id, { name: 'Old Name' })
			planRepository.seed([plan])

			const useCase = new UpdatePlanUseCase(planRepository)

			const result = await useCase.execute({
				planId: plan.id,
				tenantId: tenant.id,
				name: 'New Name',
				priceCents: 19900,
			})

			expect(result.name).toBe('New Name')
			expect(result.priceCents).toBe(19900)
		})

		it('should throw NotFoundError when plan does not exist', async () => {
			const useCase = new UpdatePlanUseCase(planRepository)

			await expect(
				useCase.execute({
					planId: 'non-existent-id',
					tenantId: tenant.id,
					name: 'New Name',
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw ConflictError when new slug already exists', async () => {
			const plan1 = createTestPlan(tenant.id, { slug: 'plan-1' })
			const plan2 = createTestPlan(tenant.id, { slug: 'plan-2' })
			planRepository.seed([plan1, plan2])

			const useCase = new UpdatePlanUseCase(planRepository)

			await expect(
				useCase.execute({
					planId: plan1.id,
					tenantId: tenant.id,
					slug: 'plan-2',
				}),
			).rejects.toThrow(ConflictError)
		})
	})

	describe('DeletePlanUseCase', () => {
		it('should delete plan successfully', async () => {
			const plan = createTestPlan(tenant.id)
			planRepository.seed([plan])

			const useCase = new DeletePlanUseCase(planRepository)

			const result = await useCase.execute({
				planId: plan.id,
				tenantId: tenant.id,
			})

			expect(result.success).toBe(true)

			const deletedPlan = await planRepository.findById(plan.id)
			expect(deletedPlan).toBeNull()
		})

		it('should throw NotFoundError when plan does not exist', async () => {
			const useCase = new DeletePlanUseCase(planRepository)

			await expect(
				useCase.execute({
					planId: 'non-existent-id',
					tenantId: tenant.id,
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('AssignFeatureUseCase', () => {
		it('should assign feature to plan', async () => {
			const plan = createTestPlan(tenant.id)
			const feature = createTestFeature()
			planRepository.seed([plan])
			featureRepository.seed([feature])

			const useCase = new AssignFeatureUseCase(planRepository, featureRepository)

			const result = await useCase.execute({
				planId: plan.id,
				tenantId: tenant.id,
				featureId: feature.id,
				value: true,
			})

			expect(result.success).toBe(true)

			const features = await planRepository.getPlanFeatures(plan.id)
			expect(features).toHaveLength(1)
			expect(features[0].featureId).toBe(feature.id)
		})

		it('should throw NotFoundError when plan does not exist', async () => {
			const feature = createTestFeature()
			featureRepository.seed([feature])

			const useCase = new AssignFeatureUseCase(planRepository, featureRepository)

			await expect(
				useCase.execute({
					planId: 'non-existent-id',
					tenantId: tenant.id,
					featureId: feature.id,
				}),
			).rejects.toThrow(NotFoundError)
		})

		it('should throw NotFoundError when feature does not exist', async () => {
			const plan = createTestPlan(tenant.id)
			planRepository.seed([plan])

			const useCase = new AssignFeatureUseCase(planRepository, featureRepository)

			await expect(
				useCase.execute({
					planId: plan.id,
					tenantId: tenant.id,
					featureId: 'non-existent-id',
				}),
			).rejects.toThrow(NotFoundError)
		})
	})

	describe('RemoveFeatureUseCase', () => {
		it('should remove feature from plan', async () => {
			const plan = createTestPlan(tenant.id)
			const feature = createTestFeature()
			planRepository.seed([plan])
			featureRepository.seed([feature])
			await planRepository.assignFeature(plan.id, feature.id, true)

			const useCase = new RemoveFeatureUseCase(planRepository)

			const result = await useCase.execute({
				planId: plan.id,
				tenantId: tenant.id,
				featureId: feature.id,
			})

			expect(result.success).toBe(true)

			const features = await planRepository.getPlanFeatures(plan.id)
			expect(features).toHaveLength(0)
		})

		it('should throw NotFoundError when plan does not exist', async () => {
			const feature = createTestFeature()
			featureRepository.seed([feature])

			const useCase = new RemoveFeatureUseCase(planRepository)

			await expect(
				useCase.execute({
					planId: 'non-existent-id',
					tenantId: tenant.id,
					featureId: feature.id,
				}),
			).rejects.toThrow(NotFoundError)
		})
	})
})
