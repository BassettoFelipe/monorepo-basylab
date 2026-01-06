import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import { CONTRACT_STATUS } from '@/db/schema/contracts'
import type { Property } from '@/db/schema/properties'
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from '@/db/schema/properties'
import type { PropertyOwner } from '@/db/schema/property-owners'
import type { Tenant } from '@/db/schema/tenants'
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
import { CreateContractUseCase } from './create-contract.use-case'

describe('CreateContractUseCase', () => {
	let useCase: CreateContractUseCase
	let contractRepository: InMemoryContractRepository
	let propertyRepository: InMemoryPropertyRepository
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let tenantRepository: InMemoryTenantRepository
	let companyRepository: InMemoryCompanyRepository
	let userRepository: InMemoryUserRepository

	let ownerUser: User
	let managerUser: User
	let brokerUser: User
	let broker2User: User
	let insuranceAnalystUser: User
	let company: Company
	let propertyOwner: PropertyOwner
	let property: Property
	let tenant: Tenant

	const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano no futuro

	beforeEach(async () => {
		contractRepository = new InMemoryContractRepository()
		propertyRepository = new InMemoryPropertyRepository()
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		tenantRepository = new InMemoryTenantRepository()
		companyRepository = new InMemoryCompanyRepository()
		userRepository = new InMemoryUserRepository()

		contractRepository.setPropertyRepository(propertyRepository)

		useCase = new CreateContractUseCase(
			contractRepository,
			propertyRepository,
			propertyOwnerRepository,
			tenantRepository,
		)

		// Create company
		company = await companyRepository.create({
			name: 'Imobiliária Teste',
			ownerId: 'temp-owner-id',
			email: 'imob@test.com',
		})

		// Create owner user
		ownerUser = await userRepository.create({
			email: 'owner@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Owner User',
			role: USER_ROLES.OWNER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		// Create manager user
		managerUser = await userRepository.create({
			email: 'manager@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Manager User',
			role: USER_ROLES.MANAGER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		// Create broker user
		brokerUser = await userRepository.create({
			email: 'broker@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Broker User',
			role: USER_ROLES.BROKER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		// Create second broker user
		broker2User = await userRepository.create({
			email: 'broker2@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Broker 2 User',
			role: USER_ROLES.BROKER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		// Create insurance analyst user
		insuranceAnalystUser = await userRepository.create({
			email: 'analyst@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Analyst User',
			role: USER_ROLES.INSURANCE_ANALYST,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		// Create property owner
		propertyOwner = await propertyOwnerRepository.create({
			companyId: company.id,
			name: 'João Silva',
			documentType: 'cpf',
			document: '12345678901',
			createdBy: ownerUser.id,
		})

		// Create property
		property = await propertyRepository.create({
			companyId: company.id,
			ownerId: propertyOwner.id,
			brokerId: brokerUser.id,
			title: 'Apartamento Centro',
			type: PROPERTY_TYPES.APARTMENT,
			listingType: LISTING_TYPES.RENT,
			status: PROPERTY_STATUS.AVAILABLE,
			rentalPrice: 150000,
			createdBy: brokerUser.id,
		})

		// Create tenant
		tenant = await tenantRepository.create({
			companyId: company.id,
			name: 'Maria Santos',
			cpf: '98765432100',
			email: 'maria@test.com',
			phone: '11988888888',
			createdBy: brokerUser.id,
		})
	})

	describe('Validações de Permissão', () => {
		test('deve permitir owner criar contrato', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.status).toBe(CONTRACT_STATUS.ACTIVE)
		})

		test('deve permitir manager criar contrato', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				createdBy: managerUser,
			})

			expect(result.id).toBeDefined()
		})

		test('deve permitir broker criar contrato para seu imóvel', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				createdBy: brokerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.brokerId).toBe(brokerUser.id)
		})

		test('deve lançar erro quando broker tenta criar contrato para imóvel de outro broker', async () => {
			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: broker2User,
				}),
			).rejects.toThrow(
				new ForbiddenError('Você só pode criar contratos para imóveis dos quais é responsável.'),
			)
		})

		test('deve lançar erro quando broker tenta criar contrato com locatário que não cadastrou', async () => {
			// Criar locatário pelo owner
			const tenantByOwner = await tenantRepository.create({
				companyId: company.id,
				name: 'Carlos Oliveira',
				cpf: '11122233344',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenantByOwner.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: brokerUser,
				}),
			).rejects.toThrow(
				new ForbiddenError('Você só pode criar contratos com locatários que você cadastrou.'),
			)
		})

		test('deve lançar erro quando insurance analyst tenta criar contrato', async () => {
			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: insuranceAnalystUser,
				}),
			).rejects.toThrow(new ForbiddenError('Você não tem permissão para criar contratos.'))
		})

		test('deve lançar erro quando usuário não tem empresa vinculada', async () => {
			const userWithoutCompany = await userRepository.create({
				email: 'nocompany@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'No Company User',
				role: USER_ROLES.OWNER,
				companyId: null,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: userWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuário sem empresa vinculada.'))
		})
	})

	describe('Validações de Datas', () => {
		test('deve lançar erro quando data de início é posterior à data de término', async () => {
			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: futureDate,
					endDate: new Date(),
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new BadRequestError('A data de início deve ser anterior à data de término.'),
			)
		})

		test('deve lançar erro quando data de início é igual à data de término', async () => {
			const sameDate = new Date()

			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: sameDate,
					endDate: sameDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new BadRequestError('A data de início deve ser anterior à data de término.'),
			)
		})
	})

	describe('Validações de Dia de Pagamento', () => {
		test('deve aceitar dia de pagamento válido (1-31)', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 15,
				createdBy: ownerUser,
			})

			expect(result.paymentDay).toBe(15)
		})

		test('deve lançar erro quando dia de pagamento é menor que 1', async () => {
			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 0,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('O dia de pagamento deve estar entre 1 e 31.'))
		})

		test('deve lançar erro quando dia de pagamento é maior que 31', async () => {
			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 32,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('O dia de pagamento deve estar entre 1 e 31.'))
		})
	})

	describe('Validações de Valor do Aluguel', () => {
		test('deve lançar erro quando valor do aluguel é zero', async () => {
			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 0,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('O valor do aluguel deve ser maior que zero.'))
		})

		test('deve lançar erro quando valor do aluguel é negativo', async () => {
			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: -100,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('O valor do aluguel deve ser maior que zero.'))
		})
	})

	describe('Validações de Imóvel', () => {
		test('deve lançar erro quando imóvel não existe', async () => {
			await expect(
				useCase.execute({
					propertyId: 'non-existent-property-id',
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new NotFoundError('Imóvel não encontrado.'))
		})

		test('deve lançar erro quando imóvel é de outra empresa', async () => {
			// Criar imóvel de outra empresa
			const otherProperty = await propertyRepository.create({
				companyId: 'other-company-id',
				ownerId: 'other-owner-id',
				title: 'Imóvel Outra Empresa',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				rentalPrice: 100000,
				createdBy: 'other-user-id',
			})

			await expect(
				useCase.execute({
					propertyId: otherProperty.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new ForbiddenError('Imóvel não pertence à sua empresa.'))
		})

		test('deve lançar erro quando imóvel não está disponível', async () => {
			// Atualizar status do imóvel para alugado
			await propertyRepository.update(property.id, {
				status: PROPERTY_STATUS.RENTED,
			})

			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(BadRequestError)
		})

		test('deve lançar erro quando já existe contrato ativo para o imóvel', async () => {
			// Criar primeiro contrato
			await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				createdBy: ownerUser,
			})

			// Criar novo locatário
			const tenant2 = await tenantRepository.create({
				companyId: company.id,
				name: 'Carlos Oliveira',
				cpf: '11122233344',
				createdBy: ownerUser.id,
			})

			// Restaurar status do imóvel para teste (normalmente ficaria alugado)
			await propertyRepository.update(property.id, {
				status: PROPERTY_STATUS.AVAILABLE,
			})

			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: tenant2.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 160000,
					paymentDay: 10,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('Já existe um contrato ativo para este imóvel.'))
		})
	})

	describe('Validações de Locatário', () => {
		test('deve lançar erro quando locatário não existe', async () => {
			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: 'non-existent-tenant-id',
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new NotFoundError('Locatário não encontrado.'))
		})

		test('deve lançar erro quando locatário é de outra empresa', async () => {
			// Criar locatário de outra empresa
			const otherTenant = await tenantRepository.create({
				companyId: 'other-company-id',
				name: 'Outro Locatário',
				cpf: '55566677788',
				createdBy: 'other-user-id',
			})

			await expect(
				useCase.execute({
					propertyId: property.id,
					tenantId: otherTenant.id,
					startDate: new Date(),
					endDate: futureDate,
					rentalAmount: 150000,
					paymentDay: 5,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new ForbiddenError('Locatário não pertence à sua empresa.'))
		})
	})

	describe('Criação de Contrato com Sucesso', () => {
		test('deve criar contrato com todos os campos', async () => {
			const startDate = new Date()

			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate,
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				depositAmount: 300000,
				notes: 'Contrato de teste',
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.companyId).toBe(company.id)
			expect(result.propertyId).toBe(property.id)
			expect(result.ownerId).toBe(propertyOwner.id)
			expect(result.tenantId).toBe(tenant.id)
			expect(result.rentalAmount).toBe(150000)
			expect(result.paymentDay).toBe(5)
			expect(result.depositAmount).toBe(300000)
			expect(result.notes).toBe('Contrato de teste')
			expect(result.status).toBe(CONTRACT_STATUS.ACTIVE)
			expect(result.createdAt).toBeDefined()
		})

		test('deve criar contrato sem campos opcionais', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.depositAmount).toBeNull()
			expect(result.notes).toBeNull()
		})

		test('deve atualizar status do imóvel para alugado', async () => {
			await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				createdBy: ownerUser,
			})

			// Verificar se o status do imóvel foi atualizado
			const updatedProperty = await propertyRepository.findById(property.id)
			expect(updatedProperty?.status).toBe(PROPERTY_STATUS.RENTED)
		})

		test('deve atribuir brokerId do imóvel quando não especificado', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				createdBy: ownerUser,
			})

			expect(result.brokerId).toBe(brokerUser.id)
		})

		test('deve atribuir brokerId automaticamente quando broker cria contrato', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 5,
				createdBy: brokerUser,
			})

			expect(result.brokerId).toBe(brokerUser.id)
		})
	})

	describe('Contrato com Múltiplos Valores de Dia de Pagamento', () => {
		test('deve aceitar dia de pagamento 1', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 1,
				createdBy: ownerUser,
			})

			expect(result.paymentDay).toBe(1)
		})

		test('deve aceitar dia de pagamento 31', async () => {
			const result = await useCase.execute({
				propertyId: property.id,
				tenantId: tenant.id,
				startDate: new Date(),
				endDate: futureDate,
				rentalAmount: 150000,
				paymentDay: 31,
				createdBy: ownerUser,
			})

			expect(result.paymentDay).toBe(31)
		})
	})
})
