import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { ForbiddenError, InternalServerError } from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from '@/db/schema/properties'
import type { PropertyOwner } from '@/db/schema/property-owners'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryPropertyOwnerRepository,
	InMemoryPropertyRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { ListPropertiesUseCase } from './list-properties.use-case'

describe('ListPropertiesUseCase', () => {
	let useCase: ListPropertiesUseCase
	let propertyRepository: InMemoryPropertyRepository
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let companyRepository: InMemoryCompanyRepository
	let userRepository: InMemoryUserRepository

	let ownerUser: User
	let managerUser: User
	let brokerUser: User
	let broker2User: User
	let insuranceAnalystUser: User
	let company: Company
	let propertyOwner: PropertyOwner

	beforeEach(async () => {
		propertyRepository = new InMemoryPropertyRepository()
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		companyRepository = new InMemoryCompanyRepository()
		userRepository = new InMemoryUserRepository()

		useCase = new ListPropertiesUseCase(propertyRepository)

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

		// Create some properties for testing
		await propertyRepository.create({
			companyId: company.id,
			ownerId: propertyOwner.id,
			brokerId: brokerUser.id,
			title: 'Apartamento Centro',
			type: PROPERTY_TYPES.APARTMENT,
			listingType: LISTING_TYPES.RENT,
			status: PROPERTY_STATUS.AVAILABLE,
			city: 'São Paulo',
			rentalPrice: 150000,
			bedrooms: 2,
			createdBy: brokerUser.id,
		})

		await propertyRepository.create({
			companyId: company.id,
			ownerId: propertyOwner.id,
			brokerId: brokerUser.id,
			title: 'Casa Jardins',
			type: PROPERTY_TYPES.HOUSE,
			listingType: LISTING_TYPES.SALE,
			status: PROPERTY_STATUS.AVAILABLE,
			city: 'São Paulo',
			salePrice: 80000000,
			bedrooms: 4,
			createdBy: brokerUser.id,
		})

		await propertyRepository.create({
			companyId: company.id,
			ownerId: propertyOwner.id,
			brokerId: broker2User.id,
			title: 'Loja Comercial',
			type: PROPERTY_TYPES.COMMERCIAL,
			listingType: LISTING_TYPES.RENT,
			status: PROPERTY_STATUS.RENTED,
			city: 'Rio de Janeiro',
			rentalPrice: 500000,
			createdBy: broker2User.id,
		})

		await propertyRepository.create({
			companyId: company.id,
			ownerId: propertyOwner.id,
			brokerId: null,
			title: 'Terreno Rural',
			type: PROPERTY_TYPES.LAND,
			listingType: LISTING_TYPES.SALE,
			status: PROPERTY_STATUS.AVAILABLE,
			city: 'Campinas',
			salePrice: 30000000,
			createdBy: ownerUser.id,
		})
	})

	describe('Validações de Permissão', () => {
		test('deve permitir owner listar todos os imóveis', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(4)
			expect(result.data).toHaveLength(4)
		})

		test('deve permitir manager listar todos os imóveis', async () => {
			const result = await useCase.execute({
				requestedBy: managerUser,
			})

			expect(result.total).toBe(4)
		})

		test('deve permitir insurance analyst listar todos os imóveis', async () => {
			const result = await useCase.execute({
				requestedBy: insuranceAnalystUser,
			})

			expect(result.total).toBe(4)
		})

		test('deve permitir broker listar apenas seus imóveis', async () => {
			const result = await useCase.execute({
				requestedBy: brokerUser,
			})

			// Broker 1 tem 2 imóveis
			expect(result.total).toBe(2)
			expect(result.data.every((p) => p.brokerId === brokerUser.id)).toBe(true)
		})

		test('deve lançar erro quando usuário não tem permissão', async () => {
			const invalidUser = await userRepository.create({
				email: 'invalid@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Invalid Role User',
				role: 'invalid_role' as any,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					requestedBy: invalidUser,
				}),
			).rejects.toThrow(new ForbiddenError('Você não tem permissão para listar imóveis.'))
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
					requestedBy: userWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuário sem empresa vinculada.'))
		})
	})

	describe('Filtros de Busca', () => {
		test('deve filtrar por texto (search)', async () => {
			const result = await useCase.execute({
				search: 'Centro',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(1)
			expect(result.data[0].title).toBe('Apartamento Centro')
		})

		test('deve filtrar por tipo de imóvel', async () => {
			const result = await useCase.execute({
				type: PROPERTY_TYPES.HOUSE,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(1)
			expect(result.data[0].type).toBe(PROPERTY_TYPES.HOUSE)
		})

		test('deve filtrar por tipo de anúncio', async () => {
			const result = await useCase.execute({
				listingType: LISTING_TYPES.RENT,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(2)
			expect(result.data.every((p) => p.listingType === LISTING_TYPES.RENT)).toBe(true)
		})

		test('deve filtrar por status', async () => {
			const result = await useCase.execute({
				status: PROPERTY_STATUS.RENTED,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(1)
			expect(result.data[0].status).toBe(PROPERTY_STATUS.RENTED)
		})

		test('deve filtrar por cidade', async () => {
			const result = await useCase.execute({
				city: 'São Paulo',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(2)
			expect(result.data.every((p) => p.city === 'São Paulo')).toBe(true)
		})

		test('deve combinar múltiplos filtros', async () => {
			const result = await useCase.execute({
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				city: 'São Paulo',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(1)
			expect(result.data[0].title).toBe('Apartamento Centro')
		})
	})

	describe('Paginação', () => {
		test('deve respeitar limit padrão de 20', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.limit).toBe(20)
		})

		test('deve respeitar limit customizado', async () => {
			const result = await useCase.execute({
				limit: 2,
				requestedBy: ownerUser,
			})

			expect(result.limit).toBe(2)
			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(4)
		})

		test('deve respeitar offset', async () => {
			const result = await useCase.execute({
				limit: 2,
				offset: 2,
				requestedBy: ownerUser,
			})

			expect(result.offset).toBe(2)
			expect(result.data).toHaveLength(2)
			expect(result.total).toBe(4)
		})

		test('deve retornar lista vazia quando offset maior que total', async () => {
			const result = await useCase.execute({
				offset: 100,
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(4)
		})
	})

	describe('Isolamento por Empresa', () => {
		test('não deve retornar imóveis de outras empresas', async () => {
			// Criar imóvel em outra empresa
			await propertyRepository.create({
				companyId: 'other-company-id',
				ownerId: 'other-owner-id',
				title: 'Imóvel Outra Empresa',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				rentalPrice: 100000,
				createdBy: 'other-user-id',
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			// Deve retornar apenas os 4 imóveis da empresa do usuário
			// (companyId é removido do DTO de retorno, mas o filtro garante o isolamento)
			expect(result.total).toBe(4)
			expect(result.data).toHaveLength(4)
		})
	})

	describe('Retorno de Dados', () => {
		test('deve retornar estrutura correta', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result).toHaveProperty('data')
			expect(result).toHaveProperty('total')
			expect(result).toHaveProperty('limit')
			expect(result).toHaveProperty('offset')
			expect(Array.isArray(result.data)).toBe(true)
		})

		test('deve retornar todos os campos do imóvel', async () => {
			const result = await useCase.execute({
				search: 'Apartamento Centro',
				requestedBy: ownerUser,
			})

			const property = result.data[0]
			expect(property).toHaveProperty('id')
			// companyId é removido do DTO de retorno por segurança
			expect(property).not.toHaveProperty('companyId')
			expect(property).toHaveProperty('ownerId')
			expect(property).toHaveProperty('brokerId')
			expect(property).toHaveProperty('title')
			expect(property).toHaveProperty('type')
			expect(property).toHaveProperty('listingType')
			expect(property).toHaveProperty('status')
			expect(property).toHaveProperty('city')
			expect(property).toHaveProperty('rentalPrice')
			expect(property).toHaveProperty('bedrooms')
		})
	})
})
