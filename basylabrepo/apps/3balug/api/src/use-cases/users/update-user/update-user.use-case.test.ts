import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import {
	EmailAlreadyExistsError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
	PlanLimitExceededError,
	UnauthorizedError,
} from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import type { Plan } from '@/db/schema/plans'
import type { User } from '@/db/schema/users'
import type { IUserCacheService } from '@/services/cache'
import {
	InMemoryCompanyRepository,
	InMemoryPlanRepository,
	InMemorySubscriptionRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { UpdateUserUseCase } from './update-user.use-case'

// Mock do UserCacheService
const mockUserCacheService: IUserCacheService = {
	get: async () => null,
	set: async () => {},
	invalidate: async () => {},
	invalidateMany: async () => {},
	invalidateAll: async () => {},
	getStats: async () => ({ totalKeys: 0, memoryUsage: '0B' }),
}

describe('UpdateUserUseCase', () => {
	let useCase: UpdateUserUseCase
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository
	let subscriptionRepository: InMemorySubscriptionRepository
	let planRepository: InMemoryPlanRepository

	let ownerUser: User
	let company: Company
	let housePlan: Plan

	beforeEach(async () => {
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()
		planRepository = new InMemoryPlanRepository()
		subscriptionRepository = new InMemorySubscriptionRepository()
		subscriptionRepository.setPlanRepository(planRepository)

		useCase = new UpdateUserUseCase(
			userRepository,
			subscriptionRepository,
			planRepository,
			mockUserCacheService,
		)

		housePlan = await planRepository.create({
			name: 'House',
			slug: 'house',
			price: 100000,
			durationDays: 30,
			maxUsers: null,
			maxManagers: 2,
			maxSerasaQueries: 100,
			allowsLateCharges: 1,
			features: [],
		})

		ownerUser = await userRepository.create({
			email: 'owner@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Owner User',
			role: USER_ROLES.OWNER,
			isActive: true,
			isEmailVerified: true,
		})

		company = await companyRepository.create({
			name: 'Test Company',
			ownerId: ownerUser.id,
			email: 'owner@test.com',
		})

		ownerUser = (await userRepository.update(ownerUser.id, {
			companyId: company.id,
		})) as User

		const now = new Date()
		const endDate = new Date(now)
		endDate.setDate(endDate.getDate() + 30)

		await subscriptionRepository.create({
			userId: ownerUser.id,
			planId: housePlan.id,
			status: 'active',
			startDate: now,
			endDate,
		})
	})

	describe('Validações de Permissão', () => {
		test('deve permitir apenas owner atualizar usuários', async () => {
			const broker = await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const targetUser = await userRepository.create({
				email: 'target@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Target User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					userId: targetUser.id,
					updatedBy: broker,
					name: 'Updated Name',
				}),
			).rejects.toThrow(
				new UnauthorizedError(
					'Você não tem permissão para editar usuários. Apenas proprietários e gerentes podem realizar esta ação.',
				),
			)
		})

		test('deve lançar erro se owner não tem empresa', async () => {
			const orphanOwner = await userRepository.create({
				email: 'orphan@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Orphan Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					userId: 'any-id',
					updatedBy: orphanOwner,
					name: 'Updated Name',
				}),
			).rejects.toThrow(new InternalServerError('Usuário sem empresa vinculada'))
		})

		test('deve lançar erro se usuário não encontrado', async () => {
			await expect(
				useCase.execute({
					userId: 'non-existent-id',
					updatedBy: ownerUser,
					name: 'Updated Name',
				}),
			).rejects.toThrow(new NotFoundError('Usuário não encontrado'))
		})

		test('deve lançar erro ao tentar editar usuário de outra empresa', async () => {
			const owner2 = await userRepository.create({
				email: 'owner2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Owner 2',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			const company2 = await companyRepository.create({
				name: 'Company 2',
				ownerId: owner2.id,
				email: 'owner2@test.com',
			})

			await userRepository.update(owner2.id, { companyId: company2.id })

			const userCompany2 = await userRepository.create({
				email: 'broker-company2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker Company 2',
				role: USER_ROLES.BROKER,
				companyId: company2.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					userId: userCompany2.id,
					updatedBy: ownerUser,
					name: 'Hacked Name',
				}),
			).rejects.toThrow(new UnauthorizedError('Você não pode editar usuários de outra empresa'))
		})

		test('deve lançar erro ao tentar editar a si mesmo', async () => {
			await expect(
				useCase.execute({
					userId: ownerUser.id,
					updatedBy: ownerUser,
					name: 'Updated Owner Name',
				}),
			).rejects.toThrow(
				new ForbiddenError(
					'Você não pode editar sua própria conta por aqui. Use a página de perfil.',
				),
			)
		})
	})

	describe('Atualização de Dados', () => {
		let brokerUser: User

		beforeEach(async () => {
			brokerUser = await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})
		})

		test('deve atualizar nome do usuário', async () => {
			const result = await useCase.execute({
				userId: brokerUser.id,
				updatedBy: ownerUser,
				name: 'Updated Broker Name',
			})

			expect(result.name).toBe('Updated Broker Name')
			expect(result.email).toBe('broker@test.com')
		})

		test('deve atualizar email do usuário', async () => {
			const result = await useCase.execute({
				userId: brokerUser.id,
				updatedBy: ownerUser,
				email: 'newbroker@test.com',
			})

			expect(result.email).toBe('newbroker@test.com')
		})

		test('deve normalizar email (lowercase + trim)', async () => {
			const result = await useCase.execute({
				userId: brokerUser.id,
				updatedBy: ownerUser,
				email: '  NEWbroker@TEST.com  ',
			})

			expect(result.email).toBe('newbroker@test.com')
		})

		test('deve atualizar role do usuário', async () => {
			const result = await useCase.execute({
				userId: brokerUser.id,
				updatedBy: ownerUser,
				role: USER_ROLES.MANAGER,
			})

			expect(result.role).toBe(USER_ROLES.MANAGER)
		})

		test('deve atualizar status isActive', async () => {
			const result = await useCase.execute({
				userId: brokerUser.id,
				updatedBy: ownerUser,
				isActive: false,
			})

			expect(result.isActive).toBe(false)
		})

		test('deve atualizar múltiplos campos simultaneamente', async () => {
			const result = await useCase.execute({
				userId: brokerUser.id,
				updatedBy: ownerUser,
				name: 'New Name',
				email: 'newemail@test.com',
				role: USER_ROLES.MANAGER,
			})

			expect(result.name).toBe('New Name')
			expect(result.email).toBe('newemail@test.com')
			expect(result.role).toBe(USER_ROLES.MANAGER)
		})
	})

	describe('Validação de Email', () => {
		test('deve lançar erro se novo email já existe', async () => {
			await userRepository.create({
				email: 'existing@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Existing User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const brokerUser = await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					userId: brokerUser.id,
					updatedBy: ownerUser,
					email: 'existing@test.com',
				}),
			).rejects.toThrow(new EmailAlreadyExistsError())
		})

		test('deve permitir manter o mesmo email', async () => {
			const brokerUser = await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				userId: brokerUser.id,
				updatedBy: ownerUser,
				email: 'broker@test.com',
				name: 'Updated Name',
			})

			expect(result.email).toBe('broker@test.com')
			expect(result.name).toBe('Updated Name')
		})
	})

	describe('Validação de Limite de Gerentes', () => {
		test('deve lançar erro ao exceder limite de gerentes', async () => {
			// Criar 2 gerentes (limite do plano House)
			await userRepository.create({
				email: 'manager1@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Manager 1',
				role: USER_ROLES.MANAGER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await userRepository.create({
				email: 'manager2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Manager 2',
				role: USER_ROLES.MANAGER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			// Tentar promover broker a manager (excede limite)
			const broker = await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					userId: broker.id,
					updatedBy: ownerUser,
					role: USER_ROLES.MANAGER,
				}),
			).rejects.toThrow(new PlanLimitExceededError('Seu plano permite no máximo 2 gerente(s)'))
		})

		test('deve permitir mudar role de manager para broker', async () => {
			const manager = await userRepository.create({
				email: 'manager@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Manager User',
				role: USER_ROLES.MANAGER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				userId: manager.id,
				updatedBy: ownerUser,
				role: USER_ROLES.BROKER,
			})

			expect(result.role).toBe(USER_ROLES.BROKER)
		})

		test('não deve validar limite se usuário já é manager', async () => {
			const manager = await userRepository.create({
				email: 'manager@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Manager User',
				role: USER_ROLES.MANAGER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			// Atualizar nome (não muda role)
			const result = await useCase.execute({
				userId: manager.id,
				updatedBy: ownerUser,
				name: 'Updated Manager Name',
			})

			expect(result.role).toBe(USER_ROLES.MANAGER)
			expect(result.name).toBe('Updated Manager Name')
		})
	})
})
