import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { Plan } from '@/types/plan'
import { ListPlansUseCase } from './list-plans.use-case'

describe('ListPlansUseCase', () => {
	let planRepository: IPlanRepository
	let listPlansUseCase: ListPlansUseCase

	const mockPlans: Plan[] = [
		{
			id: 'plan-1',
			name: 'Plano Básico',
			slug: 'plano-basico',
			description: 'Plano inicial',
			price: 4900,
			durationDays: 30,
			maxUsers: 5,
			maxManagers: 1,
			maxSerasaQueries: 100,
			allowsLateCharges: 1,
			features: ['feature1'],
			pagarmePlanId: null,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
		},
		{
			id: 'plan-2',
			name: 'Plano Premium',
			slug: 'plano-premium',
			description: 'Plano completo',
			price: 9900,
			durationDays: 30,
			maxUsers: 10,
			maxManagers: 2,
			maxSerasaQueries: 500,
			allowsLateCharges: 1,
			features: ['feature1', 'feature2'],
			pagarmePlanId: null,
			createdAt: new Date('2024-01-02'),
			updatedAt: new Date('2024-01-02'),
		},
		{
			id: 'plan-3',
			name: 'Plano Enterprise',
			slug: 'plano-enterprise',
			description: 'Plano empresarial',
			price: 19900,
			durationDays: 30,
			maxUsers: 50,
			maxManagers: 5,
			maxSerasaQueries: 1000,
			allowsLateCharges: 1,
			features: ['feature1', 'feature2', 'feature3'],
			pagarmePlanId: null,
			createdAt: new Date('2024-01-03'),
			updatedAt: new Date('2024-01-03'),
		},
	]

	beforeEach(() => {
		planRepository = {
			findAll: mock(() => Promise.resolve([...mockPlans])),
		} as unknown as IPlanRepository

		listPlansUseCase = new ListPlansUseCase(planRepository)
	})

	describe('Fluxo de sucesso', () => {
		it('deve retornar lista de planos', async () => {
			const result = await listPlansUseCase.execute()

			expect(result).toEqual(mockPlans)
			expect(planRepository.findAll).toHaveBeenCalled()
		})

		it('deve retornar todos os planos cadastrados', async () => {
			const result = await listPlansUseCase.execute()

			expect(result).toHaveLength(3)
			expect(result.every((p) => p.id && p.name && p.slug)).toBe(true)
		})

		it('deve retornar planos com todos os campos', async () => {
			const result = await listPlansUseCase.execute()

			const plan = result[0]
			expect(plan.id).toBeDefined()
			expect(plan.name).toBeDefined()
			expect(plan.slug).toBeDefined()
			expect(plan.description).toBeDefined()
			expect(plan.price).toBeDefined()
			expect(plan.durationDays).toBeDefined()
			expect(plan.maxUsers).toBeDefined()
			expect(plan.maxManagers).toBeDefined()
			expect(plan.maxSerasaQueries).toBeDefined()
			expect(plan.allowsLateCharges).toBeDefined()
			expect(plan.features).toBeInstanceOf(Array)
			expect(plan.createdAt).toBeInstanceOf(Date)
			expect(plan.updatedAt).toBeInstanceOf(Date)
		})
	})

	describe('Lista vazia', () => {
		it('deve retornar array vazio quando não há planos', async () => {
			planRepository.findAll = mock(() => Promise.resolve([]))

			const result = await listPlansUseCase.execute()

			expect(result).toEqual([])
			expect(result).toHaveLength(0)
		})
	})

	describe('Ordem dos planos', () => {
		it('deve retornar planos na ordem do repositório', async () => {
			const result = await listPlansUseCase.execute()

			expect(result[0].id).toBe('plan-1')
			expect(result[1].id).toBe('plan-2')
			expect(result[2].id).toBe('plan-3')
		})
	})
})
