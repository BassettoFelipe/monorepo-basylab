import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import { LISTING_TYPES, PROPERTY_TYPES } from '@/db/schema/properties'
import type { PropertyOwner } from '@/db/schema/property-owners'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryPropertyOwnerRepository,
	InMemoryPropertyRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { CreatePropertyUseCase } from './create-property.use-case'

describe('CreatePropertyUseCase', () => {
	let useCase: CreatePropertyUseCase
	let propertyRepository: InMemoryPropertyRepository
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let companyRepository: InMemoryCompanyRepository
	let userRepository: InMemoryUserRepository

	let ownerUser: User
	let managerUser: User
	let brokerUser: User
	let insuranceAnalystUser: User
	let company: Company
	let propertyOwner: PropertyOwner

	beforeEach(async () => {
		propertyRepository = new InMemoryPropertyRepository()
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		companyRepository = new InMemoryCompanyRepository()
		userRepository = new InMemoryUserRepository()

		useCase = new CreatePropertyUseCase(propertyRepository, propertyOwnerRepository)

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
			email: 'joao@test.com',
			phone: '11999999999',
			createdBy: ownerUser.id,
		})
	})

	describe('Validações de Permissão', () => {
		test('deve permitir owner criar imóvel', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento Centro',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.title).toBe('Apartamento Centro')
			expect(result.companyId).toBe(company.id)
		})

		test('deve permitir manager criar imóvel', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Casa Jardins',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.SALE,
				salePrice: 50000000,
				createdBy: managerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.title).toBe('Casa Jardins')
		})

		test('deve permitir broker criar imóvel de proprietário que ele cadastrou', async () => {
			// Criar proprietário pelo broker
			const brokerOwner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Maria Santos',
				documentType: 'cpf',
				document: '98765432100',
				createdBy: brokerUser.id,
			})

			const result = await useCase.execute({
				ownerId: brokerOwner.id,
				title: 'Kitnet Universitária',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 80000,
				createdBy: brokerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.brokerId).toBe(brokerUser.id)
		})

		test('deve lançar erro quando broker tenta criar imóvel de proprietário que não cadastrou', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id, // Proprietário criado pelo owner
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					rentalPrice: 150000,
					createdBy: brokerUser,
				}),
			).rejects.toThrow(
				new ForbiddenError('Você só pode cadastrar imóveis de proprietários que você cadastrou.'),
			)
		})

		test('deve lançar erro quando insurance analyst tenta criar imóvel', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					rentalPrice: 150000,
					createdBy: insuranceAnalystUser,
				}),
			).rejects.toThrow(new ForbiddenError('Você não tem permissão para criar imóveis.'))
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
					ownerId: propertyOwner.id,
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					rentalPrice: 150000,
					createdBy: userWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuário sem empresa vinculada.'))
		})
	})

	describe('Validações de Tipo de Imóvel', () => {
		test('deve aceitar tipo house', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Casa',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 200000,
				createdBy: ownerUser,
			})

			expect(result.type).toBe(PROPERTY_TYPES.HOUSE)
		})

		test('deve aceitar tipo apartment', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				createdBy: ownerUser,
			})

			expect(result.type).toBe(PROPERTY_TYPES.APARTMENT)
		})

		test('deve aceitar tipo land', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Terreno',
				type: PROPERTY_TYPES.LAND,
				listingType: LISTING_TYPES.SALE,
				salePrice: 30000000,
				createdBy: ownerUser,
			})

			expect(result.type).toBe(PROPERTY_TYPES.LAND)
		})

		test('deve aceitar tipo commercial', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Loja',
				type: PROPERTY_TYPES.COMMERCIAL,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 500000,
				createdBy: ownerUser,
			})

			expect(result.type).toBe(PROPERTY_TYPES.COMMERCIAL)
		})

		test('deve aceitar tipo rural', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Fazenda',
				type: PROPERTY_TYPES.RURAL,
				listingType: LISTING_TYPES.SALE,
				salePrice: 100000000,
				createdBy: ownerUser,
			})

			expect(result.type).toBe(PROPERTY_TYPES.RURAL)
		})

		test('deve lançar erro para tipo inválido', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Imóvel',
					type: 'invalid_type' as any,
					listingType: LISTING_TYPES.RENT,
					rentalPrice: 150000,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(BadRequestError)
		})
	})

	describe('Validações de Tipo de Anúncio', () => {
		test('deve aceitar listingType rent', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento para Locação',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				createdBy: ownerUser,
			})

			expect(result.listingType).toBe(LISTING_TYPES.RENT)
		})

		test('deve aceitar listingType sale', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Casa à Venda',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.SALE,
				salePrice: 50000000,
				createdBy: ownerUser,
			})

			expect(result.listingType).toBe(LISTING_TYPES.SALE)
		})

		test('deve aceitar listingType both', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento Venda/Locação',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.BOTH,
				rentalPrice: 150000,
				salePrice: 40000000,
				createdBy: ownerUser,
			})

			expect(result.listingType).toBe(LISTING_TYPES.BOTH)
		})

		test('deve lançar erro para listingType inválido', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Imóvel',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: 'invalid_listing' as any,
					rentalPrice: 150000,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(BadRequestError)
		})
	})

	describe('Validações de Preço', () => {
		test('deve exigir rentalPrice para locação', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new BadRequestError('Valor de locação é obrigatório para imóveis de locação.'),
			)
		})

		test('deve exigir salePrice para venda', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Casa',
					type: PROPERTY_TYPES.HOUSE,
					listingType: LISTING_TYPES.SALE,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('Valor de venda é obrigatório para imóveis à venda.'))
		})

		test('deve exigir ambos preços para listingType both', async () => {
			// Sem rentalPrice
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.BOTH,
					salePrice: 40000000,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new BadRequestError('Valor de locação é obrigatório para imóveis de locação.'),
			)

			// Sem salePrice
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.BOTH,
					rentalPrice: 150000,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('Valor de venda é obrigatório para imóveis à venda.'))
		})

		test('deve lançar erro quando rentalPrice é zero', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					rentalPrice: 0,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(
				new BadRequestError('Valor de locação é obrigatório para imóveis de locação.'),
			)
		})

		test('deve lançar erro quando salePrice é negativo', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Casa',
					type: PROPERTY_TYPES.HOUSE,
					listingType: LISTING_TYPES.SALE,
					salePrice: -100,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('Valor de venda é obrigatório para imóveis à venda.'))
		})
	})

	describe('Validações de Proprietário', () => {
		test('deve lançar erro quando proprietário não existe', async () => {
			await expect(
				useCase.execute({
					ownerId: 'non-existent-owner-id',
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					rentalPrice: 150000,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new NotFoundError('Proprietário não encontrado.'))
		})

		test('deve lançar erro quando proprietário é de outra empresa', async () => {
			// Criar outro proprietário de outra empresa
			const otherOwner = await propertyOwnerRepository.create({
				companyId: 'other-company-id',
				name: 'Outro Proprietário',
				documentType: 'cpf',
				document: '11111111111',
				createdBy: 'other-user-id',
			})

			await expect(
				useCase.execute({
					ownerId: otherOwner.id,
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					rentalPrice: 150000,
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new ForbiddenError('Proprietário não pertence à sua empresa.'))
		})
	})

	describe('Validações de CEP', () => {
		test('deve aceitar CEP válido com 8 dígitos', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				zipCode: '01310100',
				createdBy: ownerUser,
			})

			expect(result.zipCode).toBe('01310100')
		})

		test('deve aceitar CEP com máscara e normalizar', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				zipCode: '01310-100',
				createdBy: ownerUser,
			})

			expect(result.zipCode).toBe('01310100')
		})

		test('deve lançar erro para CEP inválido', async () => {
			await expect(
				useCase.execute({
					ownerId: propertyOwner.id,
					title: 'Apartamento',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					rentalPrice: 150000,
					zipCode: '12345', // CEP inválido (5 dígitos)
					createdBy: ownerUser,
				}),
			).rejects.toThrow(new BadRequestError('CEP inválido. Deve conter 8 dígitos.'))
		})
	})

	describe('Criação de Imóvel com Sucesso', () => {
		test('deve criar imóvel com todos os campos', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento Luxo',
				description: 'Apartamento de alto padrão com vista para o mar',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.BOTH,
				address: 'Av. Atlântica, 1000',
				neighborhood: 'Copacabana',
				city: 'Rio de Janeiro',
				state: 'RJ',
				zipCode: '22021-000',
				bedrooms: 4,
				bathrooms: 3,
				parkingSpaces: 2,
				area: 200,
				rentalPrice: 1500000,
				salePrice: 500000000,
				iptuPrice: 50000,
				condoFee: 200000,
				features: {
					hasPool: true,
					hasGym: true,
					hasSecurity: true,
					hasBalcony: true,
				},
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.companyId).toBe(company.id)
			expect(result.ownerId).toBe(propertyOwner.id)
			expect(result.title).toBe('Apartamento Luxo')
			expect(result.description).toBe('Apartamento de alto padrão com vista para o mar')
			expect(result.type).toBe(PROPERTY_TYPES.APARTMENT)
			expect(result.listingType).toBe(LISTING_TYPES.BOTH)
			expect(result.status).toBe('available')
			expect(result.address).toBe('Av. Atlântica, 1000')
			expect(result.neighborhood).toBe('Copacabana')
			expect(result.city).toBe('Rio de Janeiro')
			expect(result.state).toBe('RJ')
			expect(result.zipCode).toBe('22021000')
			expect(result.bedrooms).toBe(4)
			expect(result.bathrooms).toBe(3)
			expect(result.parkingSpaces).toBe(2)
			expect(result.area).toBe(200)
			expect(result.rentalPrice).toBe(1500000)
			expect(result.salePrice).toBe(500000000)
			expect(result.iptuPrice).toBe(50000)
			expect(result.condoFee).toBe(200000)
			expect(result.features).toEqual({
				hasPool: true,
				hasGym: true,
				hasSecurity: true,
				hasBalcony: true,
			})
			expect(result.createdAt).toBeDefined()
		})

		test('deve criar imóvel com campos mínimos', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Terreno',
				type: PROPERTY_TYPES.LAND,
				listingType: LISTING_TYPES.SALE,
				salePrice: 30000000,
				createdBy: ownerUser,
			})

			expect(result.id).toBeDefined()
			expect(result.title).toBe('Terreno')
			expect(result.description).toBeNull()
			expect(result.address).toBeNull()
			expect(result.bedrooms).toBe(0)
			expect(result.bathrooms).toBe(0)
			expect(result.parkingSpaces).toBe(0)
			expect(result.area).toBeNull()
		})

		test('deve normalizar campos de texto (trim)', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: '  Apartamento  ',
				description: '  Descrição com espaços  ',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				address: '  Rua Teste, 123  ',
				city: '  São Paulo  ',
				state: '  sp  ',
				createdBy: ownerUser,
			})

			expect(result.title).toBe('Apartamento')
			expect(result.description).toBe('Descrição com espaços')
			expect(result.address).toBe('Rua Teste, 123')
			expect(result.city).toBe('São Paulo')
			expect(result.state).toBe('SP')
		})

		test('deve atribuir brokerId automaticamente quando broker cria imóvel', async () => {
			// Criar proprietário pelo broker
			const brokerOwner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Proprietário do Broker',
				documentType: 'cpf',
				document: '22222222222',
				createdBy: brokerUser.id,
			})

			const result = await useCase.execute({
				ownerId: brokerOwner.id,
				title: 'Apartamento',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				createdBy: brokerUser,
			})

			expect(result.brokerId).toBe(brokerUser.id)
		})

		test('deve permitir definir brokerId quando owner/manager cria', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				brokerId: brokerUser.id,
				title: 'Apartamento',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				createdBy: ownerUser,
			})

			expect(result.brokerId).toBe(brokerUser.id)
		})

		test('deve criar imóvel com status available', async () => {
			const result = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				createdBy: ownerUser,
			})

			expect(result.status).toBe('available')
		})
	})

	describe('Múltiplos Imóveis', () => {
		test('deve criar múltiplos imóveis para o mesmo proprietário', async () => {
			const property1 = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento 1',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 150000,
				createdBy: ownerUser,
			})

			const property2 = await useCase.execute({
				ownerId: propertyOwner.id,
				title: 'Apartamento 2',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				rentalPrice: 200000,
				createdBy: ownerUser,
			})

			expect(property1.id).not.toBe(property2.id)
			expect(property1.ownerId).toBe(propertyOwner.id)
			expect(property2.ownerId).toBe(propertyOwner.id)

			const properties = await propertyRepository.findByOwnerId(propertyOwner.id)
			expect(properties).toHaveLength(2)
		})
	})
})
