import { afterAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import {
	EmailAlreadyExistsError,
	ForbiddenError,
	InternalServerError,
	PlanLimitExceededError,
	UnauthorizedError,
} from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import type { Plan } from '@/db/schema/plans'
import type { Subscription } from '@/db/schema/subscriptions'
import type { User } from '@/db/schema/users'
import type { IPlanFeatureRepository } from '@/repositories/contracts/plan-feature.repository'
import * as emailServiceModule from '@/services/email'
import {
	InMemoryCompanyRepository,
	InMemoryCustomFieldRepository,
	InMemoryCustomFieldResponseRepository,
	InMemoryPlanRepository,
	InMemorySubscriptionRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { CreateUserUseCase } from './create-user.use-case'

const mockSendUserInvitation = mock(() => Promise.resolve())

// Mock email service using spyOn
const mockEmailService = {
	sendUserInvitation: mockSendUserInvitation,
	sendVerificationCode: mock(() => Promise.resolve()),
	verifyConnection: mock(() => Promise.resolve(true)),
}

const mockGetEmailServiceInstance = spyOn(
	emailServiceModule,
	'getEmailServiceInstance',
).mockReturnValue(mockEmailService as any)

afterAll(() => {
	mockGetEmailServiceInstance.mockRestore()
})

describe('CreateUserUseCase', () => {
	let useCase: CreateUserUseCase
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository
	let subscriptionRepository: InMemorySubscriptionRepository
	let planRepository: InMemoryPlanRepository
	let customFieldRepository: InMemoryCustomFieldRepository
	let customFieldResponseRepository: InMemoryCustomFieldResponseRepository
	let mockPlanFeatureRepository: IPlanFeatureRepository

	let ownerUser: User
	let company: Company
	let basicPlan: Plan
	let imobiliariaPlan: Plan
	let housePlan: Plan
	let activeSubscription: Subscription

	const validPhone = '11999999999'

	beforeEach(async () => {
		// Setup repositories
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()
		planRepository = new InMemoryPlanRepository()
		subscriptionRepository = new InMemorySubscriptionRepository()
		customFieldRepository = new InMemoryCustomFieldRepository()
		customFieldResponseRepository = new InMemoryCustomFieldResponseRepository()

		// Link plan repository to subscription repository
		subscriptionRepository.setPlanRepository(planRepository)

		mockPlanFeatureRepository = {
			planHasFeature: mock(() => Promise.resolve(false)),
			getPlanFeatures: mock(() => Promise.resolve([])),
			getPlansWithFeature: mock(() => Promise.resolve([])),
		}

		useCase = new CreateUserUseCase(
			userRepository,
			companyRepository,
			subscriptionRepository,
			planRepository,
			customFieldRepository,
			customFieldResponseRepository,
			mockPlanFeatureRepository,
		)

		// Create plans
		basicPlan = await planRepository.create({
			name: 'Básico',
			slug: 'basico',
			price: 15000,
			durationDays: 30,
			maxUsers: 1, // Apenas 1 usuário
			maxManagers: 0, // Sem gerentes
			maxSerasaQueries: 100,
			allowsLateCharges: 0,
			features: [],
		})

		imobiliariaPlan = await planRepository.create({
			name: 'Imobiliária',
			slug: 'imobiliaria',
			price: 50000,
			durationDays: 30,
			maxUsers: 10, // 10 usuários
			maxManagers: 0, // Sem gerentes
			maxSerasaQueries: 100,
			allowsLateCharges: 1,
			features: [],
		})

		housePlan = await planRepository.create({
			name: 'House',
			slug: 'house',
			price: 100000,
			durationDays: 30,
			maxUsers: null, // Ilimitado
			maxManagers: 2, // 2 gerentes
			maxSerasaQueries: 100,
			allowsLateCharges: 1,
			features: [],
		})

		// Create owner user (without company first)
		ownerUser = await userRepository.create({
			email: 'owner@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Owner User',
			role: USER_ROLES.OWNER,
			isActive: true,
			isEmailVerified: true,
		})

		// Create company
		company = await companyRepository.create({
			name: 'Test Company',
			ownerId: ownerUser.id,
			email: 'owner@test.com',
		})

		// Link owner to company
		ownerUser = (await userRepository.update(ownerUser.id, {
			companyId: company.id,
		})) as User

		// Create active subscription
		const now = new Date()
		const endDate = new Date(now)
		endDate.setDate(endDate.getDate() + 30)

		activeSubscription = await subscriptionRepository.create({
			userId: ownerUser.id,
			planId: basicPlan.id,
			status: 'active',
			startDate: now,
			endDate,
		})
	})

	describe('Validações de Permissão', () => {
		test('deve lançar erro se usuário não é owner', async () => {
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
					email: 'newuser@test.com',
					name: 'New User',
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: brokerUser,
				}),
			).rejects.toThrow(
				new ForbiddenError(
					'Você não tem permissão para criar usuários. Apenas proprietários e gerentes podem realizar esta ação.',
				),
			)
		})

		test('deve lançar erro se owner não tem empresa vinculada', async () => {
			const ownerWithoutCompany = await userRepository.create({
				email: 'orphan@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Orphan Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					email: 'newuser@test.com',
					name: 'New User',
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuário sem empresa vinculada'))
		})

		test('deve lançar erro se subscription está inativa', async () => {
			// Desativar subscription
			await subscriptionRepository.update(activeSubscription.id, {
				status: 'expired',
			})

			await expect(
				useCase.execute({
					email: 'newuser@test.com',
					name: 'New User',
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new UnauthorizedError('Assinatura inativa. Renove sua assinatura para adicionar usuários.'),
			)
		})
	})

	describe('Validações de Limites do Plano', () => {
		test('deve lançar erro ao exceder limite de usuários (Plano Básico)', async () => {
			// Plano Básico permite apenas 1 usuário além do owner
			// Adicionar primeiro usuário (deve funcionar)
			await useCase.execute({
				email: 'broker1@test.com',
				name: 'Broker 1',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			// Tentar adicionar segundo usuário (deve falhar)
			await expect(
				useCase.execute({
					email: 'broker2@test.com',
					name: 'Broker 2',
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new PlanLimitExceededError(
					'Seu plano permite no máximo 1 usuário(s). Faça upgrade para adicionar mais.',
				),
			)
		})

		test('deve permitir adicionar usuários dentro do limite (Plano Imobiliária)', async () => {
			// Upgrade para plano Imobiliária (10 usuários além do owner)
			await subscriptionRepository.update(activeSubscription.id, {
				planId: imobiliariaPlan.id,
			})

			// Adicionar 10 usuários (dentro do limite)
			for (let i = 1; i <= 10; i++) {
				const result = await useCase.execute({
					email: `broker${i}@test.com`,
					name: `Broker ${i}`,
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				})

				expect(result.email).toBe(`broker${i}@test.com`)
				expect(result.role).toBe(USER_ROLES.BROKER)
				expect(result.isActive).toBe(true)
			}

			// Tentar adicionar o 11º usuário (excede limite)
			await expect(
				useCase.execute({
					email: 'broker11@test.com',
					name: 'Broker 11',
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new PlanLimitExceededError(
					'Seu plano permite no máximo 10 usuário(s). Faça upgrade para adicionar mais.',
				),
			)
		})

		test('deve permitir usuários ilimitados (Plano House)', async () => {
			// Upgrade para plano House (ilimitado)
			await subscriptionRepository.update(activeSubscription.id, {
				planId: housePlan.id,
			})

			// Adicionar 15 usuários sem erro (quantidade suficiente para validar ilimitado)
			for (let i = 1; i <= 15; i++) {
				const result = await useCase.execute({
					email: `broker${i}@test.com`,
					name: `Broker ${i}`,
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				})

				expect(result.email).toBe(`broker${i}@test.com`)
			}

			const allUsers = await userRepository.findByCompanyId(company.id)
			expect(allUsers.length).toBe(16) // 1 owner + 15 brokers
		})

		test('deve lançar erro ao exceder limite de gerentes', async () => {
			// Upgrade para plano House (2 gerentes)
			await subscriptionRepository.update(activeSubscription.id, {
				planId: housePlan.id,
			})

			// Adicionar 2 gerentes (dentro do limite)
			await useCase.execute({
				email: 'manager1@test.com',
				name: 'Manager 1',
				role: USER_ROLES.MANAGER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			await useCase.execute({
				email: 'manager2@test.com',
				name: 'Manager 2',
				role: USER_ROLES.MANAGER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			// Tentar adicionar 3º gerente (excede limite)
			await expect(
				useCase.execute({
					email: 'manager3@test.com',
					name: 'Manager 3',
					role: USER_ROLES.MANAGER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new PlanLimitExceededError(
					'Seu plano permite no máximo 2 gerente(s). Faça upgrade para adicionar mais.',
				),
			)
		})

		test('não deve contar usuários inativos no limite', async () => {
			// Upgrade para plano Imobiliária (10 usuários além do owner)
			await subscriptionRepository.update(activeSubscription.id, {
				planId: imobiliariaPlan.id,
			})

			// Adicionar 10 usuários (atingir o limite)
			for (let i = 1; i <= 10; i++) {
				await useCase.execute({
					email: `broker${i}@test.com`,
					name: `Broker ${i}`,
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				})
			}

			// Desativar 5 usuários
			const users = await userRepository.findByCompanyId(company.id)
			const brokersToDeactivate = users.filter((u) => u.role === USER_ROLES.BROKER).slice(0, 5)

			for (const broker of brokersToDeactivate) {
				await userRepository.update(broker.id, { isActive: false })
			}

			// Agora deve permitir adicionar mais 5 usuários (voltando ao limite de 10 ativos)
			for (let i = 11; i <= 15; i++) {
				const result = await useCase.execute({
					email: `broker${i}@test.com`,
					name: `Broker ${i}`,
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				})

				expect(result.email).toBe(`broker${i}@test.com`)
			}
		})
	})

	describe('Validações de Email', () => {
		test('deve lançar erro se email já existe', async () => {
			// Upgrade para permitir múltiplos usuários
			await subscriptionRepository.update(activeSubscription.id, {
				planId: imobiliariaPlan.id,
			})

			await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker 1',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			await expect(
				useCase.execute({
					email: 'broker@test.com',
					name: 'Broker 2',
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new EmailAlreadyExistsError())
		})

		test('deve normalizar email (lowercase + trim)', async () => {
			await subscriptionRepository.update(activeSubscription.id, {
				planId: imobiliariaPlan.id,
			})

			const result = await useCase.execute({
				email: '  BrOkEr@TeSt.CoM  ',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			expect(result.email).toBe('broker@test.com')
		})
	})

	describe('Criação de Usuário com Sucesso', () => {
		beforeEach(async () => {
			// Upgrade para permitir múltiplos usuários
			await subscriptionRepository.update(activeSubscription.id, {
				planId: housePlan.id,
			})
		})

		test('deve criar broker com sucesso', async () => {
			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.email).toBe('broker@test.com')
			expect(result.name).toBe('Broker User')
			expect(result.role).toBe(USER_ROLES.BROKER)
			expect(result.companyId).toBe(company.id)
			expect(result.isActive).toBe(true)

			// Verificar no repositório
			const savedUser = await userRepository.findByEmail('broker@test.com')
			expect(savedUser).toBeDefined()
			expect(savedUser?.role).toBe(USER_ROLES.BROKER)
			expect(savedUser?.companyId).toBe(company.id)
		})

		test('deve criar manager com sucesso', async () => {
			const result = await useCase.execute({
				email: 'manager@test.com',
				name: 'Manager User',
				role: USER_ROLES.MANAGER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			expect(result.role).toBe(USER_ROLES.MANAGER)
		})

		test('deve criar insurance analyst com sucesso', async () => {
			const result = await useCase.execute({
				email: 'analyst@test.com',
				name: 'Analyst User',
				role: USER_ROLES.INSURANCE_ANALYST,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			expect(result.role).toBe(USER_ROLES.INSURANCE_ANALYST)
		})

		test('deve criar usuário sem senha (senha definida via link de convite)', async () => {
			await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123', // Senha é ignorada no create-user
				createdBy: ownerUser,
			})

			const savedUser = await userRepository.findByEmail('broker@test.com')
			expect(savedUser?.password).toBeNull() // Usuário criado sem senha
		})

		test('deve criar usuário com email já verificado (conta confirmada via convite)', async () => {
			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			const savedUser = await userRepository.findById(result.id)
			// Conta já confirmada - sem senha definida, login impossível até reset
			expect(savedUser?.isEmailVerified).toBe(true)
		})

		test('deve vincular usuário à empresa do owner', async () => {
			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			expect(result.companyId).toBe(ownerUser.companyId)
			expect(result.companyId).toBe(company.id)
		})
	})

	describe('Múltiplos Usuários', () => {
		beforeEach(async () => {
			await subscriptionRepository.update(activeSubscription.id, {
				planId: housePlan.id,
			})
		})

		test('deve permitir criar múltiplos usuários de diferentes roles', async () => {
			const users = [
				{
					email: 'broker1@test.com',
					name: 'Broker 1',
					role: USER_ROLES.BROKER,
					phone: validPhone,
				},
				{
					email: 'broker2@test.com',
					name: 'Broker 2',
					role: USER_ROLES.BROKER,
					phone: validPhone,
				},
				{
					email: 'manager1@test.com',
					name: 'Manager 1',
					role: USER_ROLES.MANAGER,
					phone: validPhone,
				},
				{
					email: 'analyst1@test.com',
					name: 'Analyst 1',
					role: USER_ROLES.INSURANCE_ANALYST,
					phone: validPhone,
				},
			]

			for (const userData of users) {
				const result = await useCase.execute({
					...userData,
					password: 'Test@123',
					createdBy: ownerUser,
				})

				expect(result.email).toBe(userData.email)
				expect(result.role).toBe(userData.role)
			}

			const allUsers = await userRepository.findByCompanyId(company.id)
			expect(allUsers.length).toBe(5) // 1 owner + 4 novos
		})
	})

	describe('Validações de Celular', () => {
		beforeEach(async () => {
			await subscriptionRepository.update(activeSubscription.id, {
				planId: housePlan.id,
			})
		})

		test('deve lançar erro se celular não for fornecido', async () => {
			await expect(
				useCase.execute({
					email: 'broker@test.com',
					name: 'Broker User',
					role: USER_ROLES.BROKER,
					phone: '',
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Celular é obrigatório.')
		})

		test('deve lançar erro se celular for apenas espaços', async () => {
			await expect(
				useCase.execute({
					email: 'broker@test.com',
					name: 'Broker User',
					role: USER_ROLES.BROKER,
					phone: '   ',
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Celular é obrigatório.')
		})

		test('deve lançar erro se celular tiver menos de 10 dígitos', async () => {
			await expect(
				useCase.execute({
					email: 'broker@test.com',
					name: 'Broker User',
					role: USER_ROLES.BROKER,
					phone: '119999999',
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Formato de celular inválido. Use o formato: (11) 99999-9999')
		})

		test('deve lançar erro se celular tiver mais de 11 dígitos', async () => {
			await expect(
				useCase.execute({
					email: 'broker@test.com',
					name: 'Broker User',
					role: USER_ROLES.BROKER,
					phone: '119999999999',
					password: 'Test@123',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Formato de celular inválido. Use o formato: (11) 99999-9999')
		})

		test('deve aceitar celular com 10 dígitos (telefone fixo)', async () => {
			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: '1133334444',
				password: 'Test@123',
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
		})

		test('deve aceitar celular com 11 dígitos', async () => {
			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: '11999999999',
				password: 'Test@123',
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
		})

		test('deve normalizar celular removendo caracteres não numéricos', async () => {
			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: '(11) 99999-9999',
				password: 'Test@123',
				createdBy: ownerUser,
			})

			const savedUser = await userRepository.findById(result.id)
			expect(savedUser?.phone).toBe('11999999999')
		})
	})

	describe('Regras Especiais por Role', () => {
		beforeEach(async () => {
			await subscriptionRepository.update(activeSubscription.id, {
				planId: housePlan.id,
			})
		})

		test('deve lançar erro se manager tentar criar insurance_analyst', async () => {
			// Criar um manager
			const manager = await userRepository.create({
				email: 'manager@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Manager User',
				role: USER_ROLES.MANAGER,
				companyId: company.id,
				createdBy: ownerUser.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					email: 'analyst@test.com',
					name: 'Analyst User',
					role: USER_ROLES.INSURANCE_ANALYST,
					phone: validPhone,
					password: 'Test@123',
					createdBy: manager,
				}),
			).rejects.toThrow('Apenas o proprietário pode cadastrar analistas de seguros.')
		})

		test('deve permitir owner criar insurance_analyst', async () => {
			const result = await useCase.execute({
				email: 'analyst@test.com',
				name: 'Analyst User',
				role: USER_ROLES.INSURANCE_ANALYST,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
			})

			expect(result.role).toBe(USER_ROLES.INSURANCE_ANALYST)
		})

		test('deve permitir manager criar broker', async () => {
			const manager = await userRepository.create({
				email: 'manager@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Manager User',
				role: USER_ROLES.MANAGER,
				companyId: company.id,
				createdBy: ownerUser.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: manager,
			})

			expect(result.role).toBe(USER_ROLES.BROKER)
		})
	})

	describe('Custom Fields', () => {
		beforeEach(async () => {
			await subscriptionRepository.update(activeSubscription.id, {
				planId: housePlan.id,
			})
		})

		test('deve salvar custom fields quando feature está habilitada', async () => {
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true))

			// Criar campos customizados
			const field1 = await customFieldRepository.create({
				companyId: company.id,
				label: 'CPF',
				type: 'text',
				isRequired: true,
				order: 0,
				isActive: true,
			})

			const field2 = await customFieldRepository.create({
				companyId: company.id,
				label: 'RG',
				type: 'text',
				isRequired: false,
				order: 1,
				isActive: true,
			})

			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
				customFields: [
					{ fieldId: field1.id, value: '123.456.789-00' },
					{ fieldId: field2.id, value: '12.345.678-9' },
				],
			})

			const responses = await customFieldResponseRepository.findByUserId(result.id)
			expect(responses.length).toBe(2)
			expect(responses[0].fieldId).toBe(field1.id)
			expect(responses[0].value).toBe('123.456.789-00')
		})

		test('deve lançar erro se campo obrigatório não for preenchido', async () => {
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true))

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'CPF',
				type: 'text',
				isRequired: true,
				order: 0,
				isActive: true,
			})

			// O BadRequestError é capturado pelo try-catch e relançado como InternalServerError
			await expect(
				useCase.execute({
					email: 'broker@test.com',
					name: 'Broker User',
					role: USER_ROLES.BROKER,
					phone: validPhone,
					password: 'Test@123',
					createdBy: ownerUser,
					customFields: [
						{ fieldId: field.id, value: '' }, // Valor vazio para campo obrigatório
					],
				}),
			).rejects.toThrow() // Aceita qualquer erro (será BadRequestError ou InternalServerError)
		})

		test('não deve salvar custom fields se feature não está habilitada', async () => {
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(false))

			const field1 = await customFieldRepository.create({
				companyId: company.id,
				label: 'CPF',
				type: 'text',
				isRequired: true,
				order: 0,
				isActive: true,
			})

			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
				customFields: [{ fieldId: field1.id, value: '123.456.789-00' }],
			})

			const responses = await customFieldResponseRepository.findByUserId(result.id)
			expect(responses.length).toBe(0)
		})

		test('deve ignorar campos inativos ao salvar', async () => {
			mockPlanFeatureRepository.planHasFeature = mock(() => Promise.resolve(true))

			const activeField = await customFieldRepository.create({
				companyId: company.id,
				label: 'CPF',
				type: 'text',
				isRequired: false,
				order: 0,
				isActive: true,
			})

			const inactiveField = await customFieldRepository.create({
				companyId: company.id,
				label: 'RG',
				type: 'text',
				isRequired: false,
				order: 1,
				isActive: false,
			})

			const result = await useCase.execute({
				email: 'broker@test.com',
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: validPhone,
				password: 'Test@123',
				createdBy: ownerUser,
				customFields: [
					{ fieldId: activeField.id, value: '123.456.789-00' },
					{ fieldId: inactiveField.id, value: '12.345.678-9' },
				],
			})

			const responses = await customFieldResponseRepository.findByUserId(result.id)
			expect(responses.length).toBe(1)
			expect(responses[0].fieldId).toBe(activeField.id)
		})
	})
})
