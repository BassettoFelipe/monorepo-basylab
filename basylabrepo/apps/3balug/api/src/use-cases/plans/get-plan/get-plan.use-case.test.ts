import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { PlanNotFoundError } from '@basylab/core/errors'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { Plan } from '@/types/plan'
import { GetPlanUseCase } from './get-plan.use-case'

describe('GetPlanUseCase', () => {
	let planRepository: IPlanRepository
	let getPlanUseCase: GetPlanUseCase

	const mockPlan: Plan = {
		id: 'plan-123',
		name: 'Plano Premium',
		slug: 'plano-premium',
		description: 'Plano completo com todas as funcionalidades',
		price: 9900,
		durationDays: 30,
		maxUsers: 10,
		maxManagers: 2,
		maxSerasaQueries: 500,
		allowsLateCharges: 1,
		features: ['feature1', 'feature2', 'feature3'],
		pagarmePlanId: null,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
	}

	beforeEach(() => {
		planRepository = {
			findById: mock(() => Promise.resolve({ ...mockPlan })),
		} as unknown as IPlanRepository

		getPlanUseCase = new GetPlanUseCase(planRepository)
	})

	describe('Fluxo de sucesso', () => {
		it('deve retornar plano quando encontrado', async () => {
			const result = await getPlanUseCase.execute({ planId: 'plan-123' })

			expect(result).toEqual(mockPlan)
			expect(planRepository.findById).toHaveBeenCalledWith('plan-123')
		})

		it('deve retornar plano com todos os campos', async () => {
			const result = await getPlanUseCase.execute({ planId: 'plan-123' })

			expect(result.id).toBe('plan-123')
			expect(result.name).toBe('Plano Premium')
			expect(result.slug).toBe('plano-premium')
			expect(result.description).toBe('Plano completo com todas as funcionalidades')
			expect(result.price).toBe(9900)
			expect(result.durationDays).toBe(30)
			expect(result.maxUsers).toBe(10)
			expect(result.maxManagers).toBe(2)
			expect(result.maxSerasaQueries).toBe(500)
			expect(result.allowsLateCharges).toBe(1)
			expect(result.features).toEqual(['feature1', 'feature2', 'feature3'])
			expect(result.createdAt).toBeInstanceOf(Date)
			expect(result.updatedAt).toBeInstanceOf(Date)
		})

		it('deve retornar plano com valores corretos de limites', async () => {
			const result = await getPlanUseCase.execute({ planId: 'plan-123' })

			expect(result.maxManagers).toBeGreaterThan(0)
			expect(result.maxSerasaQueries).toBeGreaterThan(0)
		})
	})

	describe('Validações de erro', () => {
		it('deve lançar erro se plano não for encontrado', async () => {
			planRepository.findById = mock(() => Promise.resolve(null))

			await expect(getPlanUseCase.execute({ planId: 'non-existent' })).rejects.toThrow(
				PlanNotFoundError,
			)
		})

		it('deve lançar erro com mensagem correta', async () => {
			planRepository.findById = mock(() => Promise.resolve(null))

			await expect(getPlanUseCase.execute({ planId: 'non-existent' })).rejects.toThrow(
				'Plano não encontrado',
			)
		})
	})

	describe('Diferentes IDs', () => {
		it('deve buscar plano com ID diferente', async () => {
			await getPlanUseCase.execute({ planId: 'other-plan-id' })

			expect(planRepository.findById).toHaveBeenCalledWith('other-plan-id')
		})
	})
})
