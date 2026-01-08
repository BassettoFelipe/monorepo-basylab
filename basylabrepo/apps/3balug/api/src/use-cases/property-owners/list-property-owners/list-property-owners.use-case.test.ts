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

		// Create test property owners with varied data
		propertyOwners = []

		// Property owners criados pelo owner - com dados variados para filtros
		propertyOwners.push(
			await propertyOwnerRepository.create({
				name: 'Joao Silva Proprietario',
				documentType: 'cpf',
				document: '81105850439',
				email: 'joao.owner@example.com',
				phone: '11999999999',
				city: 'Sao Paulo',
				state: 'SP',
				companyId: company.id,
				createdBy: ownerUser.id,
			}),
		)

		propertyOwners.push(
			await propertyOwnerRepository.create({
				name: 'Maria Santos Imoveis',
				documentType: 'cnpj',
				document: '12345678000190',
				email: 'maria.owner@example.com',
				phone: '21988888888',
				city: 'Rio de Janeiro',
				state: 'RJ',
				companyId: company.id,
				createdBy: ownerUser.id,
			}),
		)

		propertyOwners.push(
			await propertyOwnerRepository.create({
				name: 'Carlos Ferreira',
				documentType: 'cpf',
				document: '52998224725',
				email: null,
				phone: null,
				city: 'Belo Horizonte',
				state: 'MG',
				companyId: company.id,
				createdBy: ownerUser.id,
			}),
		)

		propertyOwners.push(
			await propertyOwnerRepository.create({
				name: 'Ana Paula Costa',
				documentType: 'cpf',
				document: '11144477735',
				email: 'ana.costa@example.com',
				phone: null,
				city: 'Curitiba',
				state: 'PR',
				companyId: company.id,
				createdBy: ownerUser.id,
			}),
		)

		// Property owner criado pelo broker
		propertyOwners.push(
			await propertyOwnerRepository.create({
				name: 'Pedro Oliveira Proprietario',
				documentType: 'cpf',
				document: '78864706720',
				email: 'pedro.owner@example.com',
				phone: '11977777777',
				city: 'Sao Paulo',
				state: 'SP',
				companyId: company.id,
				createdBy: brokerUser.id,
			}),
		)
	})

	describe('Caso de Sucesso - Listagem Basica', () => {
		test('OWNER deve conseguir listar todos os proprietarios', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(5)
			expect(result.total).toBe(5)
			expect(result.limit).toBe(20)
			expect(result.offset).toBe(0)
		})

		test('MANAGER deve conseguir listar todos os proprietarios', async () => {
			const result = await useCase.execute({
				requestedBy: managerUser,
			})

			expect(result.data).toHaveLength(5)
			expect(result.total).toBe(5)
		})

		test('INSURANCE_ANALYST deve conseguir listar todos os proprietarios', async () => {
			const result = await useCase.execute({
				requestedBy: insuranceAnalystUser,
			})

			expect(result.data).toHaveLength(5)
			expect(result.total).toBe(5)
		})

		test('BROKER deve conseguir listar apenas proprietarios que ele criou', async () => {
			const result = await useCase.execute({
				requestedBy: brokerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.total).toBe(1)
			expect(result.data[0].name).toBe('Pedro Oliveira Proprietario')
		})

		test('deve retornar lista vazia quando nao ha proprietarios', async () => {
			// Criar novo broker sem proprietarios
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

	describe('Paginacao', () => {
		test('deve respeitar o limite especificado', async () => {
			const result = await useCase.execute({
				limit: 2,
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(2)
			expect(result.limit).toBe(2)
			expect(result.total).toBe(5)
		})

		test('deve respeitar o offset especificado', async () => {
			const result = await useCase.execute({
				limit: 2,
				offset: 2,
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(2)
			expect(result.limit).toBe(2)
			expect(result.offset).toBe(2)
			expect(result.total).toBe(5)
		})

		test('deve usar limite padrao de 20 quando nao especificado', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.limit).toBe(20)
		})

		test('deve usar offset padrao de 0 quando nao especificado', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.offset).toBe(0)
		})

		test('deve retornar array vazio quando offset maior que total', async () => {
			const result = await useCase.execute({
				offset: 100,
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(5)
		})
	})

	describe('Busca/Filtros - Search', () => {
		test('deve buscar por nome', async () => {
			const result = await useCase.execute({
				search: 'Joao',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Joao Silva Proprietario')
		})

		test('deve buscar por email', async () => {
			const result = await useCase.execute({
				search: 'maria.owner@example.com',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Maria Santos Imoveis')
		})

		test('deve buscar por documento', async () => {
			const result = await useCase.execute({
				search: '81105850439',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Joao Silva Proprietario')
		})

		test('deve buscar por telefone', async () => {
			const result = await useCase.execute({
				search: '11999999999',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Joao Silva Proprietario')
		})

		test('deve buscar por cidade', async () => {
			const result = await useCase.execute({
				search: 'Sao Paulo',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(2)
		})

		test('deve retornar lista vazia quando busca nao encontra resultados', async () => {
			const result = await useCase.execute({
				search: 'Nome Inexistente',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(0)
		})

		test('BROKER deve buscar apenas entre seus proprios proprietarios', async () => {
			// Broker tenta buscar por Joao (criado pelo owner)
			const result = await useCase.execute({
				search: 'Joao',
				requestedBy: brokerUser,
			})

			expect(result.data).toHaveLength(0)
			expect(result.total).toBe(0)
		})

		test('busca deve ser case insensitive', async () => {
			const result = await useCase.execute({
				search: 'JOAO',
				requestedBy: ownerUser,
			})

			expect(result.data).toHaveLength(1)
			expect(result.data[0].name).toBe('Joao Silva Proprietario')
		})
	})

	describe('Filtros - Tipo de Documento', () => {
		test('deve filtrar por CPF', async () => {
			const result = await useCase.execute({
				documentType: 'cpf',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(4)
			expect(result.data.every((o) => o.documentType === 'cpf')).toBe(true)
		})

		test('deve filtrar por CNPJ', async () => {
			const result = await useCase.execute({
				documentType: 'cnpj',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(1)
			expect(result.data[0].name).toBe('Maria Santos Imoveis')
		})
	})

	describe('Filtros - Estado', () => {
		test('deve filtrar por estado', async () => {
			const result = await useCase.execute({
				state: 'SP',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(2)
			expect(result.data.every((o) => o.state === 'SP')).toBe(true)
		})

		test('deve retornar vazio para estado inexistente', async () => {
			const result = await useCase.execute({
				state: 'AC',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(0)
		})
	})

	describe('Filtros - Cidade', () => {
		test('deve filtrar por cidade', async () => {
			const result = await useCase.execute({
				city: 'Sao Paulo',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(2)
			expect(result.data.every((o) => o.city === 'Sao Paulo')).toBe(true)
		})

		test('deve filtrar por cidade case insensitive', async () => {
			const result = await useCase.execute({
				city: 'sao paulo',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(2)
		})
	})

	describe('Filtros - Has Email', () => {
		test('deve filtrar proprietarios com email', async () => {
			const result = await useCase.execute({
				hasEmail: true,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(4)
			expect(result.data.every((o) => o.email !== null && o.email !== '')).toBe(true)
		})

		test('deve filtrar proprietarios sem email', async () => {
			const result = await useCase.execute({
				hasEmail: false,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(1)
			expect(result.data[0].name).toBe('Carlos Ferreira')
		})
	})

	describe('Filtros - Has Phone', () => {
		test('deve filtrar proprietarios com telefone', async () => {
			const result = await useCase.execute({
				hasPhone: true,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(3)
			expect(result.data.every((o) => o.phone !== null && o.phone !== '')).toBe(true)
		})

		test('deve filtrar proprietarios sem telefone', async () => {
			const result = await useCase.execute({
				hasPhone: false,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(2)
		})
	})

	describe('Filtros Combinados', () => {
		test('deve combinar filtro de estado com tipo de documento', async () => {
			const result = await useCase.execute({
				state: 'SP',
				documentType: 'cpf',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(2)
			expect(result.data.every((o) => o.state === 'SP' && o.documentType === 'cpf')).toBe(true)
		})

		test('deve combinar filtro de cidade com hasEmail', async () => {
			const result = await useCase.execute({
				city: 'Sao Paulo',
				hasEmail: true,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(2)
		})

		test('deve combinar busca com filtro de estado', async () => {
			const result = await useCase.execute({
				search: 'Joao',
				state: 'SP',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(1)
			expect(result.data[0].name).toBe('Joao Silva Proprietario')
		})

		test('deve combinar multiplos filtros e retornar vazio quando nao ha match', async () => {
			const result = await useCase.execute({
				state: 'SP',
				documentType: 'cnpj',
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(0)
		})
	})

	describe('Ordenacao', () => {
		test('deve ordenar por nome ascendente (padrao)', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			const names = result.data.map((o) => o.name)
			const sortedNames = [...names].sort()
			expect(names).toEqual(sortedNames)
		})

		test('deve ordenar por nome descendente', async () => {
			const result = await useCase.execute({
				sortBy: 'name',
				sortOrder: 'desc',
				requestedBy: ownerUser,
			})

			const names = result.data.map((o) => o.name)
			const sortedNames = [...names].sort().reverse()
			expect(names).toEqual(sortedNames)
		})

		test('deve ordenar por data de criacao ascendente', async () => {
			const result = await useCase.execute({
				sortBy: 'createdAt',
				sortOrder: 'asc',
				requestedBy: ownerUser,
			})

			const dates = result.data.map((o) => new Date(o.createdAt).getTime())
			for (let i = 1; i < dates.length; i++) {
				expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1])
			}
		})

		test('deve ordenar por data de criacao descendente', async () => {
			const result = await useCase.execute({
				sortBy: 'createdAt',
				sortOrder: 'desc',
				requestedBy: ownerUser,
			})

			const dates = result.data.map((o) => new Date(o.createdAt).getTime())
			for (let i = 1; i < dates.length; i++) {
				expect(dates[i]).toBeLessThanOrEqual(dates[i - 1])
			}
		})

		test('deve ordenar por cidade ascendente', async () => {
			const result = await useCase.execute({
				sortBy: 'city',
				sortOrder: 'asc',
				requestedBy: ownerUser,
			})

			const cities = result.data.map((o) => o.city ?? '')
			const sortedCities = [...cities].sort()
			expect(cities).toEqual(sortedCities)
		})

		test('deve ordenar por estado descendente', async () => {
			const result = await useCase.execute({
				sortBy: 'state',
				sortOrder: 'desc',
				requestedBy: ownerUser,
			})

			const states = result.data.map((o) => o.state ?? '')
			const sortedStates = [...states].sort().reverse()
			expect(states).toEqual(sortedStates)
		})
	})

	describe('Formato do Output', () => {
		test('deve remover campos internos (updatedAt, createdBy, companyId)', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			const firstOwner = result.data[0]

			// Nao deve ter campos internos
			expect(firstOwner).not.toHaveProperty('updatedAt')
			expect(firstOwner).not.toHaveProperty('createdBy')
			expect(firstOwner).not.toHaveProperty('companyId')

			// Deve ter campos publicos
			expect(firstOwner).toHaveProperty('id')
			expect(firstOwner).toHaveProperty('name')
			expect(firstOwner).toHaveProperty('document')
			expect(firstOwner).toHaveProperty('documentType')
			expect(firstOwner).toHaveProperty('createdAt')
		})

		test('deve manter createdAt para exibicao no frontend', async () => {
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
		})
	})

	describe('Isolamento por Empresa', () => {
		test('deve listar apenas proprietarios da empresa do usuario', async () => {
			// Criar outra empresa com proprietarios
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

			// Criar proprietario na outra empresa
			await propertyOwnerRepository.create({
				name: 'Carlos Almeida Proprietario',
				documentType: 'cpf',
				document: '20142327093',
				companyId: otherCompany.id,
				createdBy: updatedOtherOwner.id,
			})

			// Owner da primeira empresa deve ver apenas 5 proprietarios
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(5)
			expect(result.data).toHaveLength(5)
			expect(result.data.every((o) => o.name !== 'Carlos Almeida Proprietario')).toBe(true)
		})
	})

	describe('Validacoes de Erro', () => {
		test('deve lancar erro se usuario nao tem empresa vinculada', async () => {
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

		test('ADMIN nao esta na lista de roles permitidos e deve lancar erro', async () => {
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

	describe('Filtros de Data', () => {
		test('deve filtrar por data de criacao (inicio)', async () => {
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)

			const result = await useCase.execute({
				createdAtStart: yesterday,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(5)
			expect(result.data.every((o) => new Date(o.createdAt) >= yesterday)).toBe(true)
		})

		test('deve filtrar por data de criacao (fim)', async () => {
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)

			const result = await useCase.execute({
				createdAtEnd: tomorrow,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(5)
		})

		test('deve filtrar por intervalo de datas', async () => {
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)

			const result = await useCase.execute({
				createdAtStart: yesterday,
				createdAtEnd: tomorrow,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(5)
		})

		test('deve retornar vazio quando intervalo de datas nao corresponde', async () => {
			const lastMonth = new Date()
			lastMonth.setMonth(lastMonth.getMonth() - 1)
			const twoMonthsAgo = new Date()
			twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

			const result = await useCase.execute({
				createdAtStart: twoMonthsAgo,
				createdAtEnd: lastMonth,
				requestedBy: ownerUser,
			})

			expect(result.total).toBe(0)
		})
	})
})
