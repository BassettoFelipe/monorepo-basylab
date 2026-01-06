import { beforeEach, describe, expect, test } from 'bun:test'
import { ForbiddenError, InternalServerError } from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryContractRepository,
	InMemoryPropertyOwnerRepository,
	InMemoryPropertyRepository,
	InMemoryTenantRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { GetDashboardStatsUseCase } from './get-dashboard-stats.use-case'

describe('GetDashboardStatsUseCase', () => {
	let useCase: GetDashboardStatsUseCase
	let propertyRepository: InMemoryPropertyRepository
	let contractRepository: InMemoryContractRepository
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let tenantRepository: InMemoryTenantRepository
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository

	let company: Company
	let ownerUser: User
	let managerUser: User
	let brokerUser: User
	let adminUser: User
	let insuranceAnalystUser: User

	beforeEach(async () => {
		// Setup repositories
		propertyRepository = new InMemoryPropertyRepository()
		contractRepository = new InMemoryContractRepository()
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		tenantRepository = new InMemoryTenantRepository()
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()

		useCase = new GetDashboardStatsUseCase(
			propertyRepository,
			contractRepository,
			propertyOwnerRepository,
			tenantRepository,
		)

		// Create test data
		company = await companyRepository.create({
			name: 'Imobiliária Teste',
			cnpj: '12345678901234',
		})

		ownerUser = await userRepository.create({
			name: 'Owner User',
			email: 'owner@test.com',
			password: 'hashed_password',
			role: USER_ROLES.OWNER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		managerUser = await userRepository.create({
			name: 'Manager User',
			email: 'manager@test.com',
			password: 'hashed_password',
			role: USER_ROLES.MANAGER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		brokerUser = await userRepository.create({
			name: 'Broker User',
			email: 'broker@test.com',
			password: 'hashed_password',
			role: USER_ROLES.BROKER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		adminUser = await userRepository.create({
			name: 'Admin User',
			email: 'admin@test.com',
			password: 'hashed_password',
			role: USER_ROLES.ADMIN,
			companyId: null,
			isActive: true,
			isEmailVerified: true,
		})

		insuranceAnalystUser = await userRepository.create({
			name: 'Insurance Analyst',
			email: 'analyst@test.com',
			password: 'hashed_password',
			role: USER_ROLES.INSURANCE_ANALYST,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})
	})

	describe('Casos de Sucesso - OWNER', () => {
		test('deve retornar estatísticas do dashboard para OWNER com dados vazios', async () => {
			const result = await useCase.execute({ user: ownerUser })

			expect(result).toBeDefined()
			expect(result.properties).toBeDefined()
			expect(result.properties.total).toBe(0)
			expect(result.properties.available).toBe(0)
			expect(result.properties.rented).toBe(0)
			expect(result.contracts).toBeDefined()
			expect(result.contracts.total).toBe(0)
			expect(result.contracts.active).toBe(0)
			expect(result.contracts.terminated).toBe(0)
			expect(result.propertyOwners.total).toBe(0)
			expect(result.tenants.total).toBe(0)
			expect(result.expiringContracts).toEqual([])
		})

		test('deve retornar estatísticas corretas com imóveis e contratos', async () => {
			// Create property owner
			const owner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Property Owner',
				email: 'owner1@test.com',
				documentType: 'cpf',
				document: '12345678901',
				createdBy: ownerUser.id,
			})

			// Create tenant
			const tenant = await tenantRepository.create({
				companyId: company.id,
				name: 'Tenant 1',
				email: 'tenant1@test.com',
				cpf: '98765432100',
				createdBy: ownerUser.id,
			})

			// Create properties
			await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Property 1',
				description: 'Description 1',
				type: 'apartment',
				status: 'available',
				createdBy: ownerUser.id,
			})

			const property2 = await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Property 2',
				description: 'Description 2',
				type: 'house',
				status: 'rented',
				createdBy: ownerUser.id,
			})

			// Create contracts
			await contractRepository.create({
				companyId: company.id,
				propertyId: property2.id,
				ownerId: owner.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				rentalAmount: 200000,
				status: 'active',
				createdBy: ownerUser.id,
			})

			const result = await useCase.execute({ user: ownerUser })

			expect(result.properties.total).toBe(2)
			expect(result.properties.available).toBe(1)
			expect(result.properties.rented).toBe(1)
			expect(result.contracts.total).toBe(1)
			expect(result.contracts.active).toBe(1)
			expect(result.contracts.terminated).toBe(0)
			expect(result.propertyOwners.total).toBe(1)
			expect(result.tenants.total).toBe(1)
		})

		test('deve retornar contratos expirando nos próximos 30 dias', async () => {
			const owner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Property Owner',
				email: 'owner1@test.com',
				documentType: 'cpf',
				document: '12345678901',
				createdBy: ownerUser.id,
			})

			const tenant = await tenantRepository.create({
				companyId: company.id,
				name: 'Tenant 1',
				email: 'tenant1@test.com',
				cpf: '98765432100',
				createdBy: ownerUser.id,
			})

			const property = await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Property 1',
				description: 'Description 1',
				type: 'apartment',
				status: 'rented',
				createdBy: ownerUser.id,
			})

			const expiringContract = await contractRepository.create({
				companyId: company.id,
				propertyId: property.id,
				ownerId: owner.id,
				tenantId: tenant.id,
				startDate: new Date(Date.now() - 335 * 24 * 60 * 60 * 1000),
				endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
				rentalAmount: 100000,
				status: 'active',
				createdBy: ownerUser.id,
			})

			const result = await useCase.execute({ user: ownerUser })

			expect(result.expiringContracts).toHaveLength(1)
			expect(result.expiringContracts[0].id).toBe(expiringContract.id)
			expect(result.expiringContracts[0].propertyId).toBe(property.id)
			expect(result.expiringContracts[0].tenantId).toBe(tenant.id)
			expect(result.expiringContracts[0].rentalAmount).toBe(100000)
			expect(result.expiringContracts[0].endDate).toBeInstanceOf(Date)
		})
	})

	describe('Casos de Sucesso - BROKER', () => {
		test('deve retornar estatísticas filtradas por broker', async () => {
			const owner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Property Owner',
				email: 'owner1@test.com',
				documentType: 'cpf',
				document: '12345678901',
				createdBy: brokerUser.id,
			})

			await tenantRepository.create({
				companyId: company.id,
				name: 'Tenant 1',
				email: 'tenant1@test.com',
				cpf: '98765432100',
				createdBy: brokerUser.id,
			})

			// Property created by broker
			await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Broker Property',
				description: 'Description',
				type: 'apartment',
				status: 'available',
				brokerId: brokerUser.id,
				createdBy: brokerUser.id,
			})

			// Property created by owner (should not appear in broker stats)
			await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Owner Property',
				description: 'Description',
				type: 'house',
				status: 'available',
				brokerId: ownerUser.id,
				createdBy: ownerUser.id,
			})

			const result = await useCase.execute({ user: brokerUser })

			expect(result.properties.total).toBe(1) // Only broker's property
			expect(result.propertyOwners.total).toBe(1) // Total count by company
			expect(result.tenants.total).toBe(1)
		})

		test('deve retornar apenas contratos expirando do broker', async () => {
			const owner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Property Owner',
				email: 'owner1@test.com',
				documentType: 'cpf',
				document: '12345678901',
				createdBy: brokerUser.id,
			})

			const tenant = await tenantRepository.create({
				companyId: company.id,
				name: 'Tenant 1',
				email: 'tenant1@test.com',
				cpf: '98765432100',
				createdBy: brokerUser.id,
			})

			const brokerProperty = await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Broker Property',
				description: 'Description',
				type: 'apartment',
				status: 'rented',
				brokerId: brokerUser.id,
				createdBy: brokerUser.id,
			})

			const ownerProperty = await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Owner Property',
				description: 'Description',
				type: 'house',
				status: 'rented',
				brokerId: ownerUser.id,
				createdBy: ownerUser.id,
			})

			// Broker's expiring contract
			await contractRepository.create({
				companyId: company.id,
				propertyId: brokerProperty.id,
				ownerId: owner.id,
				tenantId: tenant.id,
				startDate: new Date(Date.now() - 335 * 24 * 60 * 60 * 1000),
				endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
				rentalAmount: 100000,
				status: 'active',
				brokerId: brokerUser.id,
				createdBy: brokerUser.id,
			})

			// Owner's expiring contract (should not appear for broker)
			await contractRepository.create({
				companyId: company.id,
				propertyId: ownerProperty.id,
				ownerId: owner.id,
				tenantId: tenant.id,
				startDate: new Date(Date.now() - 335 * 24 * 60 * 60 * 1000),
				endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
				rentalAmount: 200000,
				status: 'active',
				brokerId: ownerUser.id,
				createdBy: ownerUser.id,
			})

			const result = await useCase.execute({ user: brokerUser })

			expect(result.expiringContracts).toHaveLength(1)
			expect(result.expiringContracts[0].propertyId).toBe(brokerProperty.id)
		})
	})

	describe('Casos de Sucesso - Outras Roles', () => {
		test('deve permitir acesso para MANAGER', async () => {
			const result = await useCase.execute({ user: managerUser })

			expect(result).toBeDefined()
			expect(result.properties).toBeDefined()
			expect(result.contracts).toBeDefined()
			expect(result.propertyOwners).toBeDefined()
			expect(result.tenants).toBeDefined()
			expect(result.expiringContracts).toBeDefined()
		})

		test('deve permitir acesso para ADMIN', async () => {
			const result = await useCase.execute({ user: adminUser })

			expect(result).toBeDefined()
			expect(result.properties).toBeDefined()
			expect(result.contracts).toBeDefined()
		})

		test('deve permitir acesso para INSURANCE_ANALYST', async () => {
			const result = await useCase.execute({ user: insuranceAnalystUser })

			expect(result).toBeDefined()
			expect(result.properties).toBeDefined()
			expect(result.contracts).toBeDefined()
		})
	})

	describe('Validações de Erro', () => {
		test('deve lançar erro para role não autorizada', async () => {
			const unauthorizedUser = await userRepository.create({
				name: 'Unauthorized User',
				email: 'unauthorized@test.com',
				password: 'hashed_password',
				role: 'unauthorized_role' as any,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(useCase.execute({ user: unauthorizedUser })).rejects.toThrow(
				new ForbiddenError('Você não tem permissão para acessar o dashboard.'),
			)
		})

		test('deve lançar erro quando usuário não-admin não tem empresa vinculada', async () => {
			const userWithoutCompany = await userRepository.create({
				name: 'User Without Company',
				email: 'nocompany@test.com',
				password: 'hashed_password',
				role: USER_ROLES.OWNER,
				companyId: null,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(useCase.execute({ user: userWithoutCompany })).rejects.toThrow(
				new InternalServerError('Usuário sem empresa vinculada.'),
			)
		})

		test('deve permitir admin sem empresa vinculada', async () => {
			const result = await useCase.execute({ user: adminUser })

			expect(result).toBeDefined()
		})
	})

	describe('Isolamento por Empresa', () => {
		test('deve retornar apenas dados da empresa do usuário', async () => {
			// Create another company
			const company2 = await companyRepository.create({
				name: 'Imobiliária 2',
				cnpj: '98765432109876',
			})

			const owner2 = await userRepository.create({
				name: 'Owner 2',
				email: 'owner2@test.com',
				password: 'password',
				role: USER_ROLES.OWNER,
				companyId: company2.id,
				isActive: true,
				isEmailVerified: true,
			})

			// Create data for company 1
			const owner1Data = await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Owner 1',
				email: 'owner1@test.com',
				documentType: 'cpf',
				document: '12345678901',
				createdBy: ownerUser.id,
			})

			await propertyRepository.create({
				companyId: company.id,
				ownerId: owner1Data.id,
				title: 'Property Company 1',
				description: 'Description',
				type: 'apartment',
				status: 'available',
				createdBy: ownerUser.id,
			})

			// Create data for company 2
			const owner2Data = await propertyOwnerRepository.create({
				companyId: company2.id,
				name: 'Owner 2',
				email: 'owner2data@test.com',
				documentType: 'cpf',
				document: '98765432100',
				createdBy: owner2.id,
			})

			await propertyRepository.create({
				companyId: company2.id,
				ownerId: owner2Data.id,
				title: 'Property Company 2',
				description: 'Description',
				type: 'house',
				status: 'available',
				createdBy: owner2.id,
			})

			const resultCompany1 = await useCase.execute({ user: ownerUser })
			const resultCompany2 = await useCase.execute({ user: owner2 })

			expect(resultCompany1.properties.total).toBe(1)
			expect(resultCompany1.propertyOwners.total).toBe(1)

			expect(resultCompany2.properties.total).toBe(1)
			expect(resultCompany2.propertyOwners.total).toBe(1)
		})
	})

	describe('Contratos Terminados', () => {
		test('deve contar corretamente contratos ativos e terminados', async () => {
			const owner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Property Owner',
				email: 'owner1@test.com',
				documentType: 'cpf',
				document: '12345678901',
				createdBy: ownerUser.id,
			})

			const tenant = await tenantRepository.create({
				companyId: company.id,
				name: 'Tenant 1',
				email: 'tenant1@test.com',
				cpf: '98765432100',
				createdBy: ownerUser.id,
			})

			const property1 = await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Property 1',
				description: 'Description 1',
				type: 'apartment',
				status: 'rented',
				createdBy: ownerUser.id,
			})

			const property2 = await propertyRepository.create({
				companyId: company.id,
				ownerId: owner.id,
				title: 'Property 2',
				description: 'Description 2',
				type: 'house',
				status: 'available',
				createdBy: ownerUser.id,
			})

			// Active contract
			await contractRepository.create({
				companyId: company.id,
				propertyId: property1.id,
				ownerId: owner.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				rentalAmount: 100000,
				status: 'active',
				createdBy: ownerUser.id,
			})

			// Terminated contract
			await contractRepository.create({
				companyId: company.id,
				propertyId: property2.id,
				ownerId: owner.id,
				tenantId: tenant.id,
				startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
				endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
				rentalAmount: 200000,
				status: 'terminated',
				createdBy: ownerUser.id,
			})

			const result = await useCase.execute({ user: ownerUser })

			expect(result.contracts.total).toBe(2)
			expect(result.contracts.active).toBe(1)
			expect(result.contracts.terminated).toBe(1)
		})
	})
})
