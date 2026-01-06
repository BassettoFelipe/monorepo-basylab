import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { ForbiddenError, InternalServerError } from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import type { PropertyOwner } from '@/db/schema/property-owners'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryPropertyOwnerRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { ListPropertyOwnersUseCase } from './list-property-owners.use-case'

describe('ListPropertyOwnersUseCase', () => {
	let useCase: ListPropertyOwnersUseCase
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository

	let ownerUser: User
	let managerUser: User
	let brokerUser: User
	let insuranceAnalystUser: User
	let company: Company
	let propertyOwners: PropertyOwner[]

	beforeEach(async () => {
		// Setup repositories
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()

		// Create use case
		useCase = new ListPropertyOwnersUseCase(propertyOwnerRepository)

		// Create owner user
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

		// Create test property owners
		propertyOwners = []

		// Property owners criados pelo owner
		propertyOwners.push(
			await propertyOwnerRepository.create({
				name: 'João Silva Proprietário',
				documentType: 'cpf',
				document: '81105850439',
				email: 'joao.owner@example.com',
				companyId: company.id,
				createdBy: ownerUser.id,
			}),
		)

		propertyOwners.push(
			await propertyOwnerRepository.create({
				name: 'Maria Santos Imóveis',
				documentType: 'cnpj',
				document: '12345678000190',
				email: 'maria.owner@example.com',
				companyId: company.id,
				createdBy: ownerUser.id,
			}),
		)

		// Property owner criado pelo broker
		propertyOwners.push(
			await propertyOwnerRepository.create({
				name: 'Pedro Oliveira Proprietário',
				documentType: 'cpf',
				document: '78864706720',
				email: 'pedro.owner@example.com',
				companyId: company.id,
				createdBy: brokerUser.id,
			}),
		)
	})

	describe('Caso de Sucesso - Listagem Básica', () => {
		test('OWNER deve conseguir listar todos os proprietários', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(3)
			expect(result.total).toBe(3)
			expect(result.limit).toBe(20)
			expect(result.offset).toBe(0)
		})

		test('MANAGER deve conseguir listar todos os proprietários', async () => {
			const result = await useCase.execute({
				requestedBy: managerUser,
			})

			expect(result.data).toHaveLength(3)
			expect(result.total).toBe(3)
		})

		test('INSURANCE_ANALYST deve conseguir listar todos os proprietários', async () => {
			const result = await useCase.execute({
				requestedBy: insuranceAnalystUser,
			})

			expect(result.data).toHaveLength(3)
			expect(result.total).toBe(3)
		})

		test('BROKER deve conseguir listar apenas proprietários que ele criou', async () => {
			const result = await useCase.execute({
				requestedBy: brokerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.total).toBe(1)
			expect(result.data[0].name).toBe('Pedro Oliveira Proprietário')
		})

		test('deve retornar lista vazia quando não há proprietários', async () => {
			// Criar novo broker sem proprietários
			const newBroker = await userRepository.create({
				email: 'newbroker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'New Broker',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				requestedBy: newBroker,
			})

			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(0)
		})
	})

	describe('Paginação', () => {
		test('deve respeitar o limite especificado', async () => {
			const result = await useCase.execute({
				limit: 2,
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(2)
			expect(result.limit).toBe(2)
			expect(result.total).toBe(3)
		})

		test('deve respeitar o offset especificado', async () => {
			const result = await useCase.execute({
				limit: 2,
				offset: 2,
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.limit).toBe(2)
			expect(result.offset).toBe(2)
			expect(result.total).toBe(3)
		})

		test('deve usar limite padrão de 20 quando não especificado', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.limit).toBe(20)
		})

		test('deve usar offset padrão de 0 quando não especificado', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.offset).toBe(0)
		})
	})

	describe('Busca/Filtros', () => {
		test('deve buscar por nome', async () => {
			const result = await useCase.execute({
				search: 'João',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('João Silva Proprietário')
		})

		test('deve buscar por email', async () => {
			const result = await useCase.execute({
				search: 'maria.owner@example.com',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Maria Santos Imóveis')
		})

		test('deve retornar lista vazia quando busca não encontra resultados', async () => {
			const result = await useCase.execute({
				search: 'Nome Inexistente',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(0)
		})

		test('BROKER deve buscar apenas entre seus próprios proprietários', async () => {
			// Broker tenta buscar por João (criado pelo owner)
			const result = await useCase.execute({
				search: 'João',
				requestedBy: brokerUser,
			})

			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(0)
		})
	})

	describe('Formato do Output', () => {
		test('deve remover campos internos (updatedAt, createdBy, companyId)', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			const firstOwner = result.data[0]

			// Não deve ter campos internos
			expect(firstOwner).not.toHaveProperty('updatedAt')
			expect(firstOwner).not.toHaveProperty('createdBy')
			expect(firstOwner).not.toHaveProperty('companyId')

			// Deve ter campos públicos
			expect(firstOwner).toHaveProperty('id')
			expect(firstOwner).toHaveProperty('name')
			expect(firstOwner).toHaveProperty('document')
			expect(firstOwner).toHaveProperty('documentType')
			expect(firstOwner).toHaveProperty('createdAt')
		})

		test('deve manter createdAt para exibição no frontend', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			const firstOwner = result.data[0]
			expect(firstOwner.createdAt).toBeDefined()
			expect(firstOwner.createdAt).toBeInstanceOf(Date)
		})

		test('deve incluir tipo de documento (CPF ou CNPJ)', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			const cpfOwner = result.data.find((o) => o.documentType === 'cpf')
			const cnpjOwner = result.data.find((o) => o.documentType === 'cnpj')

			expect(cpfOwner).toBeDefined()
			expect(cnpjOwner).toBeDefined()
			expect(cpfOwner?.name).toBe('João Silva Proprietário')
			expect(cnpjOwner?.name).toBe('Maria Santos Imóveis')
		})
	})

	describe('Isolamento por Empresa', () => {
		test('deve listar apenas proprietários da empresa do usuário', async () => {
			// Criar outra empresa com proprietários
			const otherOwner = await userRepository.create({
				email: 'other@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Other Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				ownerId: otherOwner.id,
				email: 'other@test.com',
			})

			const updatedOtherOwner = (await userRepository.update(otherOwner.id, {
				companyId: otherCompany.id,
			})) as User

			// Criar proprietário na outra empresa
			await propertyOwnerRepository.create({
				name: 'Carlos Almeida Proprietário',
				documentType: 'cpf',
				document: '20142327093',
				companyId: otherCompany.id,
				createdBy: updatedOtherOwner.id,
			})

			// Owner da primeira empresa deve ver apenas 3 proprietários
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(3)
			expect(result.data).toHaveLength(3)
			expect(result.data.every((o) => o.name !== 'Carlos Almeida Proprietário')).toBe(true)
		})
	})

	describe('Validações de Erro', () => {
		test('deve lançar erro se usuário não tem empresa vinculada', async () => {
			const userWithoutCompany = await userRepository.create({
				email: 'orphan@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Orphan User',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					requestedBy: userWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuário sem empresa vinculada.'))
		})

		test('ADMIN não está na lista de roles permitidos e deve lançar erro', async () => {
			const adminUser = await userRepository.create({
				email: 'admin@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Admin User',
				role: USER_ROLES.ADMIN,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					requestedBy: adminUser,
				}),
			).rejects.toThrow(new ForbiddenError('Você não tem permissão para listar proprietários.'))
		})
	})
})
