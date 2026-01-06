import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import type { Contract } from '@/db/schema/contracts'
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
import { TerminateContractUseCase } from './terminate-contract.use-case'

describe('TerminateContractUseCase', () => {
	let useCase: TerminateContractUseCase
	let contractRepository: InMemoryContractRepository
	let propertyRepository: InMemoryPropertyRepository
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let tenantRepository: InMemoryTenantRepository
	let companyRepository: InMemoryCompanyRepository
	let userRepository: InMemoryUserRepository

	let ownerUser: User
	let managerUser: User
	let brokerUser: User
	let insuranceAnalystUser: User
	let company: Company
	let propertyOwner: PropertyOwner
	let property: Property
	let tenant: Tenant
	let contract: Contract

	beforeEach(async () => {
		contractRepository = new InMemoryContractRepository()
		propertyRepository = new InMemoryPropertyRepository()
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		tenantRepository = new InMemoryTenantRepository()
		companyRepository = new InMemoryCompanyRepository()
		userRepository = new InMemoryUserRepository()

		contractRepository.setPropertyRepository(propertyRepository)

		useCase = new TerminateContractUseCase(contractRepository, propertyRepository)

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

		managerUser = await userRepository.create({
			email: 'manager@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Manager User',
			role: USER_ROLES.MANAGER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		brokerUser = await userRepository.create({
			email: 'broker@test.com',
			password: await PasswordUtils.hash('Test@123'),
			name: 'Broker User',
			role: USER_ROLES.BROKER,
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

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

		// Create property (rented)
		property = await propertyRepository.create({
			companyId: company.id,
			ownerId: propertyOwner.id,
			brokerId: brokerUser.id,
			title: 'Apartamento Centro',
			type: PROPERTY_TYPES.APARTMENT,
			listingType: LISTING_TYPES.RENT,
			status: PROPERTY_STATUS.RENTED,
			rentalPrice: 150000,
			createdBy: brokerUser.id,
		})

		// Create tenant
		tenant = await tenantRepository.create({
			companyId: company.id,
			name: 'Maria Santos',
			cpf: '98765432100',
			createdBy: ownerUser.id,
		})

		// Create active contract
		contract = await contractRepository.create({
			companyId: company.id,
			propertyId: property.id,
			ownerId: propertyOwner.id,
			tenantId: tenant.id,
			brokerId: brokerUser.id,
			startDate: new Date('2024-01-01'),
			endDate: new Date('2024-12-31'),
			rentalAmount: 150000,
			paymentDay: 5,
			status: CONTRACT_STATUS.ACTIVE,
			createdBy: ownerUser.id,
		})
	})

	describe('Validações de Permissão', () => {
		test('deve permitir owner encerrar contrato', async () => {
			const result = await useCase.execute({
				id: contract.id,
				terminatedBy: ownerUser,
			})

			expect(result.status).toBe(CONTRACT_STATUS.TERMINATED)
		})

		test('deve permitir manager encerrar contrato', async () => {
			const result = await useCase.execute({
				id: contract.id,
				terminatedBy: managerUser,
			})

			expect(result.status).toBe(CONTRACT_STATUS.TERMINATED)
		})

		test('deve lançar erro quando broker tenta encerrar contrato', async () => {
			await expect(
				useCase.execute({
					id: contract.id,
					terminatedBy: brokerUser,
				}),
			).rejects.toThrow(new ForbiddenError('Você não tem permissão para encerrar contratos.'))
		})

		test('deve lançar erro quando insurance analyst tenta encerrar contrato', async () => {
			await expect(
				useCase.execute({
					id: contract.id,
					terminatedBy: insuranceAnalystUser,
				}),
			).rejects.toThrow(new ForbiddenError('Você não tem permissão para encerrar contratos.'))
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
					id: contract.id,
					terminatedBy: userWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuário sem empresa vinculada.'))
		})
	})

	describe('Validações de Contrato', () => {
		test('deve lançar erro quando contrato não existe', async () => {
			await expect(
				useCase.execute({
					id: 'non-existent-id',
					terminatedBy: ownerUser,
				}),
			).rejects.toThrow(new NotFoundError('Contrato não encontrado.'))
		})

		test('deve lançar erro quando contrato é de outra empresa', async () => {
			const otherContract = await contractRepository.create({
				companyId: 'other-company-id',
				propertyId: 'other-property-id',
				ownerId: 'other-owner-id',
				tenantId: 'other-tenant-id',
				startDate: new Date(),
				endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				rentalAmount: 100000,
				paymentDay: 5,
				createdBy: 'other-user-id',
			})

			await expect(
				useCase.execute({
					id: otherContract.id,
					terminatedBy: ownerUser,
				}),
			).rejects.toThrow(new ForbiddenError('Você não tem permissão para encerrar este contrato.'))
		})

		test('deve lançar erro quando contrato já está encerrado', async () => {
			// Encerrar primeiro
			await contractRepository.update(contract.id, {
				status: CONTRACT_STATUS.TERMINATED,
			})

			await expect(
				useCase.execute({
					id: contract.id,
					terminatedBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('Apenas contratos ativos podem ser encerrados.'))
		})

		test('deve lançar erro quando contrato está cancelado', async () => {
			await contractRepository.update(contract.id, {
				status: CONTRACT_STATUS.CANCELLED,
			})

			await expect(
				useCase.execute({
					id: contract.id,
					terminatedBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('Apenas contratos ativos podem ser encerrados.'))
		})

		test('deve lançar erro quando contrato está vencido', async () => {
			await contractRepository.update(contract.id, {
				status: CONTRACT_STATUS.EXPIRED,
			})

			await expect(
				useCase.execute({
					id: contract.id,
					terminatedBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('Apenas contratos ativos podem ser encerrados.'))
		})
	})

	describe('Encerramento com Sucesso', () => {
		test('deve encerrar contrato sem motivo', async () => {
			const result = await useCase.execute({
				id: contract.id,
				terminatedBy: ownerUser,
			})

			expect(result.status).toBe(CONTRACT_STATUS.TERMINATED)
			expect(result.terminatedAt).toBeDefined()
			expect(result.terminationReason).toBeNull()
		})

		test('deve encerrar contrato com motivo', async () => {
			const result = await useCase.execute({
				id: contract.id,
				reason: 'Locatário solicitou encerramento antecipado',
				terminatedBy: ownerUser,
			})

			expect(result.status).toBe(CONTRACT_STATUS.TERMINATED)
			expect(result.terminatedAt).toBeDefined()
			expect(result.terminationReason).toBe('Locatário solicitou encerramento antecipado')
		})

		test('deve normalizar motivo (trim)', async () => {
			const result = await useCase.execute({
				id: contract.id,
				reason: '  Motivo com espaços  ',
				terminatedBy: ownerUser,
			})

			expect(result.terminationReason).toBe('Motivo com espaços')
		})

		test('deve atualizar status do imóvel para disponível', async () => {
			// Verificar que o imóvel está alugado antes
			expect(property.status).toBe(PROPERTY_STATUS.RENTED)

			await useCase.execute({
				id: contract.id,
				terminatedBy: ownerUser,
			})

			// Verificar que o imóvel foi liberado
			const updatedProperty = await propertyRepository.findById(property.id)
			expect(updatedProperty?.status).toBe(PROPERTY_STATUS.AVAILABLE)
		})
	})

	describe('Múltiplos Contratos', () => {
		test('deve encerrar apenas o contrato especificado', async () => {
			// Criar outro imóvel e contrato
			const property2 = await propertyRepository.create({
				companyId: company.id,
				ownerId: propertyOwner.id,
				title: 'Casa Jardins',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.RENTED,
				rentalPrice: 250000,
				createdBy: ownerUser.id,
			})

			const tenant2 = await tenantRepository.create({
				companyId: company.id,
				name: 'Carlos Oliveira',
				cpf: '11122233344',
				createdBy: ownerUser.id,
			})

			const contract2 = await contractRepository.create({
				companyId: company.id,
				propertyId: property2.id,
				ownerId: propertyOwner.id,
				tenantId: tenant2.id,
				startDate: new Date(),
				endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				rentalAmount: 250000,
				paymentDay: 10,
				status: CONTRACT_STATUS.ACTIVE,
				createdBy: ownerUser.id,
			})

			// Encerrar apenas o primeiro contrato
			await useCase.execute({
				id: contract.id,
				terminatedBy: ownerUser,
			})

			// Verificar que o primeiro foi encerrado
			const terminatedContract = await contractRepository.findById(contract.id)
			expect(terminatedContract?.status).toBe(CONTRACT_STATUS.TERMINATED)

			// Verificar que o segundo continua ativo
			const activeContract = await contractRepository.findById(contract2.id)
			expect(activeContract?.status).toBe(CONTRACT_STATUS.ACTIVE)

			// Verificar status dos imóveis
			const updatedProperty1 = await propertyRepository.findById(property.id)
			expect(updatedProperty1?.status).toBe(PROPERTY_STATUS.AVAILABLE)

			const updatedProperty2 = await propertyRepository.findById(property2.id)
			expect(updatedProperty2?.status).toBe(PROPERTY_STATUS.RENTED)
		})
	})

	describe('Data de Encerramento', () => {
		test('deve registrar data de encerramento', async () => {
			const beforeTermination = new Date()

			const result = await useCase.execute({
				id: contract.id,
				terminatedBy: ownerUser,
			})

			const afterTermination = new Date()

			expect(result.terminatedAt).toBeDefined()
			expect(result.terminatedAt!.getTime()).toBeGreaterThanOrEqual(beforeTermination.getTime())
			expect(result.terminatedAt!.getTime()).toBeLessThanOrEqual(afterTermination.getTime())
		})
	})
})
