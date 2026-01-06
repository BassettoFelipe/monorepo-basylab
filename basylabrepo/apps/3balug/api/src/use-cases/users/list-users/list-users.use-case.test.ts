import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { UnauthorizedError } from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryCustomFieldRepository,
	InMemoryCustomFieldResponseRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { ListUsersUseCase } from './list-users.use-case'

describe('ListUsersUseCase', () => {
	let useCase: ListUsersUseCase
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository
	let customFieldRepository: InMemoryCustomFieldRepository
	let customFieldResponseRepository: InMemoryCustomFieldResponseRepository

	let ownerUser: User
	let company: Company

	beforeEach(async () => {
		// Setup repositories
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()
		customFieldRepository = new InMemoryCustomFieldRepository()
		customFieldResponseRepository = new InMemoryCustomFieldResponseRepository()

		useCase = new ListUsersUseCase(
			userRepository,
			customFieldRepository,
			customFieldResponseRepository,
		)

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
	})

	describe('Validações de Permissão', () => {
		test('deve permitir owner listar usuários', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result).toBeDefined()
			expect(result.users).toBeArray()
			expect(result.total).toBe(0) // Apenas owner existe, mas é excluído da listagem
			expect(result.page).toBe(1)
			expect(result.limit).toBe(20)
		})

		test('deve permitir manager listar usuários', async () => {
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
				requestedBy: manager,
			})

			expect(result).toBeDefined()
			expect(result.users).toBeArray()
		})

		test('deve lançar erro se broker tentar listar', async () => {
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
					requestedBy: broker,
				}),
			).rejects.toThrow(
				new UnauthorizedError('Apenas donos da conta e gerentes podem listar usuários'),
			)
		})

		test('deve lançar erro se insurance analyst tentar listar', async () => {
			const analyst = await userRepository.create({
				email: 'analyst@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Analyst User',
				role: USER_ROLES.INSURANCE_ANALYST,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					requestedBy: analyst,
				}),
			).rejects.toThrow(
				new UnauthorizedError('Apenas donos da conta e gerentes podem listar usuários'),
			)
		})

		test('deve lançar erro se usuário não tem empresa vinculada', async () => {
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
					requestedBy: orphanOwner,
				}),
			).rejects.toThrow(new UnauthorizedError('Usuário sem empresa vinculada'))
		})
	})

	describe('Listagem de Usuários', () => {
		beforeEach(async () => {
			// Criar usuários de teste
			await userRepository.create({
				email: 'broker1@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 1',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await userRepository.create({
				email: 'broker2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 2',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

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
				email: 'analyst1@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Analyst 1',
				role: USER_ROLES.INSURANCE_ANALYST,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			// Criar usuário inativo
			await userRepository.create({
				email: 'broker3@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 3 (Inativo)',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: false,
				isEmailVerified: true,
			})
		})

		test('deve listar todos os usuários (exceto owner)', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.users.length).toBe(5) // 2 brokers + 1 manager + 1 analyst + 1 inativo
			expect(result.total).toBe(5)
			expect(result.users.every((u) => u.role !== USER_ROLES.OWNER)).toBe(true)
		})

		test('deve filtrar por role (broker)', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				role: USER_ROLES.BROKER,
			})

			expect(result.users.length).toBe(3) // 2 ativos + 1 inativo
			expect(result.users.every((u) => u.role === USER_ROLES.BROKER)).toBe(true)
		})

		test('deve filtrar por role (manager)', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				role: USER_ROLES.MANAGER,
			})

			expect(result.users.length).toBe(1)
			expect(result.users[0].role).toBe(USER_ROLES.MANAGER)
		})

		test('deve filtrar por isActive=true', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				isActive: true,
			})

			expect(result.users.length).toBe(4) // Todos exceto o inativo
			expect(result.users.every((u) => u.isActive)).toBe(true)
		})

		test('deve filtrar por isActive=false', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				isActive: false,
			})

			expect(result.users.length).toBe(1)
			expect(result.users[0].isActive).toBe(false)
			expect(result.users[0].email).toBe('broker3@test.com')
		})

		test('deve filtrar por role + isActive', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				role: USER_ROLES.BROKER,
				isActive: true,
			})

			expect(result.users.length).toBe(2) // 2 brokers ativos
			expect(result.users.every((u) => u.role === USER_ROLES.BROKER)).toBe(true)
			expect(result.users.every((u) => u.isActive)).toBe(true)
		})

		test("deve listar 'all' (mesmo comportamento que sem filtro)", async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				role: 'all',
			})

			expect(result.users.length).toBe(5)
		})
	})

	describe('Paginação', () => {
		beforeEach(async () => {
			// Criar 25 usuários para testar paginação
			for (let i = 1; i <= 25; i++) {
				await userRepository.create({
					email: `broker${i}@test.com`,
					password: await PasswordUtils.hash('Test@123'),
					name: `Broker ${i}`,
					role: USER_ROLES.BROKER,
					companyId: company.id,
					isActive: true,
					isEmailVerified: true,
				})
			}
		})

		test('deve retornar primeira página (default: 20 itens)', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.users.length).toBe(20)
			expect(result.page).toBe(1)
			expect(result.limit).toBe(20)
			expect(result.total).toBe(25)
			expect(result.totalPages).toBe(2)
		})

		test('deve retornar segunda página', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				page: 2,
			})

			expect(result.users.length).toBe(5) // Restante
			expect(result.page).toBe(2)
			expect(result.total).toBe(25)
		})

		test('deve respeitar limit customizado', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				limit: 10,
			})

			expect(result.users.length).toBe(10)
			expect(result.limit).toBe(10)
			expect(result.totalPages).toBe(3) // 25 / 10 = 3 páginas
		})

		test('deve retornar página vazia se page > totalPages', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
				page: 10,
			})

			expect(result.users.length).toBe(0)
			expect(result.page).toBe(10)
			expect(result.total).toBe(25)
		})
	})

	describe('Ordenação', () => {
		test('deve ordenar por data de criação (mais recentes primeiro)', async () => {
			// Criar usuários com delays para garantir ordem diferente
			const user1 = await userRepository.create({
				email: 'broker1@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 1',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await new Promise((resolve) => setTimeout(resolve, 10))

			const user2 = await userRepository.create({
				email: 'broker2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 2',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await new Promise((resolve) => setTimeout(resolve, 10))

			const user3 = await userRepository.create({
				email: 'broker3@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 3',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			// Mais recente deve vir primeiro
			expect(result.users[0].id).toBe(user3.id)
			expect(result.users[1].id).toBe(user2.id)
			expect(result.users[2].id).toBe(user1.id)
		})
	})

	describe('Isolamento por Empresa', () => {
		test('deve listar apenas usuários da própria empresa', async () => {
			// Criar outra empresa e usuários
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

			await userRepository.update(owner2.id, {
				companyId: company2.id,
			})

			// Adicionar usuários na company 1
			await userRepository.create({
				email: 'broker1@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 1 - Company 1',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			// Adicionar usuários na company 2
			await userRepository.create({
				email: 'broker2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 2 - Company 2',
				role: USER_ROLES.BROKER,
				companyId: company2.id,
				isActive: true,
				isEmailVerified: true,
			})

			// Owner 1 deve ver apenas usuários da company 1
			const result1 = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result1.users.length).toBe(1)
			expect(result1.users[0].email).toBe('broker1@test.com')

			// Owner 2 deve ver apenas usuários da company 2
			const owner2Updated = await userRepository.findById(owner2.id)
			const result2 = await useCase.execute({
				requestedBy: owner2Updated as User,
			})

			expect(result2.users.length).toBe(1)
			expect(result2.users[0].email).toBe('broker2@test.com')
		})
	})

	describe('Formato de Resposta', () => {
		test('deve retornar campos corretos no formato UserListItem', async () => {
			await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			const user = result.users[0]
			expect(user).toHaveProperty('id')
			expect(user).toHaveProperty('email')
			expect(user).toHaveProperty('name')
			expect(user).toHaveProperty('role')
			// companyId é removido do DTO de retorno por segurança
			expect(user).not.toHaveProperty('companyId')
			expect(user).toHaveProperty('isActive')
			expect(user).toHaveProperty('isEmailVerified')
			expect(user).toHaveProperty('hasPendingCustomFields')
			expect(user).toHaveProperty('createdAt')
			expect(user).not.toHaveProperty('updatedAt') // updatedAt não está no UserListItem
			expect(user).not.toHaveProperty('password') // Nunca retornar senha
		})

		test('deve retornar phone no formato correto', async () => {
			await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: '11999999999',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.users[0].phone).toBe('11999999999')
		})

		test('deve retornar phone null quando não fornecido', async () => {
			await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				phone: null,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.users[0].phone).toBeNull()
		})

		test('deve retornar createdAt como string ISO', async () => {
			await userRepository.create({
				email: 'broker@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker User',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			const user = result.users[0]
			expect(typeof user.createdAt).toBe('string')
			expect(() => new Date(user.createdAt)).not.toThrow()
		})
	})

	describe('Custom Fields - Pending Status', () => {
		beforeEach(async () => {
			// Criar usuários de teste
			await userRepository.create({
				email: 'broker1@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 1',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})
		})

		test('deve retornar hasPendingCustomFields=false quando não há campos customizados', async () => {
			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.users[0].hasPendingCustomFields).toBe(false)
		})

		test('deve retornar hasPendingCustomFields=true quando há campos obrigatórios não respondidos', async () => {
			// Criar campo obrigatório
			await customFieldRepository.create({
				companyId: company.id,
				label: 'CPF',
				type: 'text',
				isRequired: true,
				order: 0,
				isActive: true,
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.users[0].hasPendingCustomFields).toBe(true)
		})

		test('deve retornar hasPendingCustomFields=false quando todos campos obrigatórios foram respondidos', async () => {
			const broker = await userRepository.findByEmail('broker1@test.com')

			// Criar campo obrigatório
			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'CPF',
				type: 'text',
				isRequired: true,
				order: 0,
				isActive: true,
			})

			// Criar resposta
			await customFieldResponseRepository.create({
				userId: broker!.id,
				fieldId: field.id,
				value: '123.456.789-00',
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			expect(result.users[0].hasPendingCustomFields).toBe(false)
		})

		test('deve calcular hasPendingCustomFields corretamente para múltiplos usuários', async () => {
			// Criar mais um usuário
			await userRepository.create({
				email: 'broker2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 2',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const broker1 = await userRepository.findByEmail('broker1@test.com')

			// Criar campo obrigatório
			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'CPF',
				type: 'text',
				isRequired: true,
				order: 0,
				isActive: true,
			})

			// Apenas broker1 responde
			await customFieldResponseRepository.create({
				userId: broker1!.id,
				fieldId: field.id,
				value: '123.456.789-00',
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			// Verificar que ambos usuários estão na lista
			expect(result.users.length).toBe(2)

			// Encontrar cada usuário e verificar seu status
			const broker1Result = result.users.find((u) => u.email === 'broker1@test.com')
			const broker2Result = result.users.find((u) => u.email === 'broker2@test.com')

			expect(broker1Result).toBeDefined()
			expect(broker1Result!.hasPendingCustomFields).toBe(false)

			expect(broker2Result).toBeDefined()
			expect(broker2Result!.hasPendingCustomFields).toBe(true)
		})

		test('deve considerar apenas campos ativos ao calcular pendências', async () => {
			const broker = await userRepository.findByEmail('broker1@test.com')

			// Criar campo obrigatório ativo
			const activeField = await customFieldRepository.create({
				companyId: company.id,
				label: 'CPF',
				type: 'text',
				isRequired: true,
				order: 0,
				isActive: true,
			})

			// Criar campo obrigatório inativo
			await customFieldRepository.create({
				companyId: company.id,
				label: 'RG',
				type: 'text',
				isRequired: true,
				order: 1,
				isActive: false, // Inativo
			})

			// Responder apenas o campo ativo
			await customFieldResponseRepository.create({
				userId: broker!.id,
				fieldId: activeField.id,
				value: '123.456.789-00',
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			// Não deve ter pendências pois o campo inativo não conta
			expect(result.users[0].hasPendingCustomFields).toBe(false)
		})
	})

	describe('Exclusão do Próprio Usuário', () => {
		test('deve excluir o próprio usuário da listagem (manager)', async () => {
			const manager = await userRepository.create({
				email: 'manager@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Manager User',
				role: USER_ROLES.MANAGER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await userRepository.create({
				email: 'broker1@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 1',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				requestedBy: manager,
			})

			// Deve listar apenas o broker, não o próprio manager
			expect(result.users.length).toBe(1)
			expect(result.users[0].email).toBe('broker1@test.com')
			expect(result.users.every((u) => u.id !== manager.id)).toBe(true)
		})

		test('deve excluir owner da listagem', async () => {
			await userRepository.create({
				email: 'broker1@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Broker 1',
				role: USER_ROLES.BROKER,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const result = await useCase.execute({
				requestedBy: ownerUser,
			})

			// Não deve incluir o owner na listagem
			expect(result.users.every((u) => u.id !== ownerUser.id)).toBe(true)
			expect(result.users.every((u) => u.role !== USER_ROLES.OWNER)).toBe(true)
		})
	})
})
