import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { ContactValidator, DocumentValidator } from '@basylab/core/validation'
import type { Company } from '@/db/schema/companies'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryTenantRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { CreateTenantUseCase } from './create-tenant.use-case'

describe('CreateTenantUseCase', () => {
	let useCase: CreateTenantUseCase
	let tenantRepository: InMemoryTenantRepository
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository
	let documentValidator: DocumentValidator
	let contactValidator: ContactValidator

	let ownerUser: User
	let company: Company

	beforeEach(async () => {
		// Setup repositories
		tenantRepository = new InMemoryTenantRepository()
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()

		// Setup services
		documentValidator = new DocumentValidator()
		contactValidator = new ContactValidator()

		// Create use case
		useCase = new CreateTenantUseCase(tenantRepository, documentValidator, contactValidator)

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

	describe('Caso de Sucesso', () => {
		test('deve criar um locatário com dados completos', async () => {
			const result = await useCase.execute({
				name: 'João Silva',
				cpf: '811.058.504-39',
				email: 'joao@example.com',
				phone: '(11) 99999-9999',
				address: 'Rua Teste, 123',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234-567',
				birthDate: '1990-01-01',
				monthlyIncome: 5000,
				employer: 'Empresa Teste',
				emergencyContact: 'Maria Silva',
				emergencyPhone: '(11) 98888-8888',
				notes: 'Cliente VIP',
				createdBy: ownerUser,
			})

			expect(result).toBeDefined()
			expect(result.id).toBeDefined()
			expect(result.companyId).toBe(company.id)
			expect(result.name).toBe('João Silva')
			expect(result.cpf).toBe('81105850439')
			expect(result.email).toBe('joao@example.com')
			expect(result.phone).toBe('11999999999')
			expect(result.address).toBe('Rua Teste, 123')
			expect(result.city).toBe('São Paulo')
			expect(result.state).toBe('SP')
			expect(result.zipCode).toBe('01234567')
			expect(result.birthDate).toBe('1990-01-01')
			expect(result.monthlyIncome).toBe(5000)
			expect(result.employer).toBe('Empresa Teste')
			expect(result.emergencyContact).toBe('Maria Silva')
			expect(result.emergencyPhone).toBe('11988888888')
			expect(result.notes).toBe('Cliente VIP')
			expect(result.createdAt).toBeInstanceOf(Date)
		})

		test('deve criar um locatário com dados mínimos (apenas nome e CPF)', async () => {
			const result = await useCase.execute({
				name: 'Maria Santos',
				cpf: '996.908.529-81',
				createdBy: ownerUser,
			})

			expect(result).toBeDefined()
			expect(result.id).toBeDefined()
			expect(result.companyId).toBe(company.id)
			expect(result.name).toBe('Maria Santos')
			expect(result.cpf).toBe('99690852981')
			expect(result.email).toBeNull()
			expect(result.phone).toBeNull()
			expect(result.address).toBeNull()
			expect(result.monthlyIncome).toBeNull()
		})

		test('deve normalizar CPF removendo caracteres especiais', async () => {
			const result = await useCase.execute({
				name: 'Pedro Oliveira',
				cpf: '788.647.067-20',
				createdBy: ownerUser,
			})

			expect(result.cpf).toBe('78864706720')
		})

		test('deve normalizar email para lowercase', async () => {
			const result = await useCase.execute({
				name: 'Ana Costa',
				cpf: '201.423.270-93',
				email: 'ANA.COSTA@EXAMPLE.COM',
				createdBy: ownerUser,
			})

			expect(result.email).toBe('ana.costa@example.com')
		})

		test('deve normalizar telefone removendo caracteres especiais', async () => {
			const result = await useCase.execute({
				name: 'Carlos Almeida',
				cpf: '813.308.654-05',
				phone: '(21) 98765-4321',
				createdBy: ownerUser,
			})

			expect(result.phone).toBe('21987654321')
		})

		test('deve normalizar CEP removendo caracteres especiais', async () => {
			const result = await useCase.execute({
				name: 'Fernanda Lima',
				cpf: '117.300.607-90',
				zipCode: '12345-678',
				createdBy: ownerUser,
			})

			expect(result.zipCode).toBe('12345678')
		})

		test('deve normalizar estado para maiúsculo', async () => {
			const result = await useCase.execute({
				name: 'Roberto Santos',
				cpf: '440.505.205-08',
				state: 'rj',
				createdBy: ownerUser,
			})

			expect(result.state).toBe('RJ')
		})
	})

	describe('Validações de Dados Obrigatórios', () => {
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
					name: 'João Silva',
					cpf: '577.331.288-38',
					createdBy: userWithoutCompany,
				}),
			).rejects.toThrow('Usuário sem empresa vinculada')
		})

		test('deve lançar erro para CPF inválido', async () => {
			await expect(
				useCase.execute({
					name: 'João Silva',
					cpf: '111.111.111-11',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('CPF inválido')
		})

		test('deve lançar erro para CPF vazio', async () => {
			await expect(
				useCase.execute({
					name: 'João Silva',
					cpf: '',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('CPF inválido')
		})

		test('deve lançar erro para email inválido', async () => {
			await expect(
				useCase.execute({
					name: 'João Silva',
					cpf: '930.137.927-95',
					email: 'email-invalido',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('E-mail inválido')
		})

		test('deve lançar erro para renda mensal negativa', async () => {
			await expect(
				useCase.execute({
					name: 'João Silva',
					cpf: '371.752.564-69',
					monthlyIncome: -1000,
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Renda mensal não pode ser negativa')
		})
	})

	describe('Validação de CPF Duplicado', () => {
		test('deve lançar erro ao tentar criar locatário com CPF duplicado na mesma empresa', async () => {
			// Criar primeiro locatário
			await useCase.execute({
				name: 'João Silva',
				cpf: '343.487.494-18',
				createdBy: ownerUser,
			})

			// Tentar criar segundo locatário com mesmo CPF
			await expect(
				useCase.execute({
					name: 'João Santos',
					cpf: '343.487.494-18',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Já existe um locatário cadastrado com este CPF na sua empresa.')
		})

		test('deve permitir mesmo CPF em empresas diferentes', async () => {
			// Criar primeiro locatário
			await useCase.execute({
				name: 'João Silva',
				cpf: '539.618.454-09',
				createdBy: ownerUser,
			})

			// Criar outra empresa e owner
			const otherOwner = await userRepository.create({
				email: 'owner2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Other Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				ownerId: otherOwner.id,
				email: 'owner2@test.com',
			})

			const updatedOtherOwner = (await userRepository.update(otherOwner.id, {
				companyId: otherCompany.id,
			})) as User

			// Deve permitir criar locatário com mesmo CPF em outra empresa
			const result = await useCase.execute({
				name: 'João Silva',
				cpf: '539.618.454-09',
				createdBy: updatedOtherOwner,
			})

			expect(result).toBeDefined()
			expect(result.companyId).toBe(otherCompany.id)
		})
	})

	describe('Validação de Email Duplicado', () => {
		test('deve lançar erro ao tentar criar locatário com email duplicado na mesma empresa', async () => {
			// Criar primeiro locatário
			await useCase.execute({
				name: 'João Silva',
				cpf: '320.141.829-30',
				email: 'joao@example.com',
				createdBy: ownerUser,
			})

			// Tentar criar segundo locatário com mesmo email
			await expect(
				useCase.execute({
					name: 'Maria Santos',
					cpf: '243.527.567-68',
					email: 'joao@example.com',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Já existe um locatário cadastrado com este e-mail')
		})

		test('deve lançar erro para email duplicado case-insensitive', async () => {
			await useCase.execute({
				name: 'João Silva',
				cpf: '637.335.120-30',
				email: 'joao@example.com',
				createdBy: ownerUser,
			})

			await expect(
				useCase.execute({
					name: 'Maria Santos',
					cpf: '112.960.814-00',
					email: 'JOAO@EXAMPLE.COM',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Já existe um locatário cadastrado com este e-mail')
		})

		test('deve permitir mesmo email em empresas diferentes', async () => {
			await useCase.execute({
				name: 'João Silva',
				cpf: '371.396.935-36',
				email: 'joao@example.com',
				createdBy: ownerUser,
			})

			// Criar outra empresa
			const otherOwner = await userRepository.create({
				email: 'owner2@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Other Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				ownerId: otherOwner.id,
				email: 'owner2@test.com',
			})

			const updatedOtherOwner = (await userRepository.update(otherOwner.id, {
				companyId: otherCompany.id,
			})) as User

			const result = await useCase.execute({
				name: 'João Silva',
				cpf: '831.139.314-10',
				email: 'joao@example.com',
				createdBy: updatedOtherOwner,
			})

			expect(result).toBeDefined()
			expect(result.email).toBe('joao@example.com')
		})

		test('deve permitir criar múltiplos locatários sem email', async () => {
			const tenant1 = await useCase.execute({
				name: 'João Silva',
				cpf: '640.246.406-66',
				createdBy: ownerUser,
			})

			const tenant2 = await useCase.execute({
				name: 'Maria Santos',
				cpf: '169.496.035-84',
				createdBy: ownerUser,
			})

			expect(tenant1).toBeDefined()
			expect(tenant2).toBeDefined()
			expect(tenant1.email).toBeNull()
			expect(tenant2.email).toBeNull()
		})
	})

	describe('Isolamento por Empresa', () => {
		test('deve criar locatário vinculado à empresa do usuário', async () => {
			const result = await useCase.execute({
				name: 'João Silva',
				cpf: '811.058.504-39',
				createdBy: ownerUser,
			})

			expect(result.companyId).toBe(company.id)
		})

		test('deve isolar locatários por empresa', async () => {
			// Criar locatário na primeira empresa
			const tenant1 = await useCase.execute({
				name: 'João Silva',
				cpf: '996.908.529-81',
				createdBy: ownerUser,
			})

			// Criar segunda empresa
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

			const updatedOwner2 = (await userRepository.update(owner2.id, {
				companyId: company2.id,
			})) as User

			// Criar locatário na segunda empresa
			const tenant2 = await useCase.execute({
				name: 'Maria Santos',
				cpf: '788.647.067-20',
				createdBy: updatedOwner2,
			})

			expect(tenant1.companyId).toBe(company.id)
			expect(tenant2.companyId).toBe(company2.id)
			expect(tenant1.companyId).not.toBe(tenant2.companyId)

			// Verificar que cada empresa vê apenas seus próprios locatários
			const company1Tenants = await tenantRepository.findByCompanyId(company.id)
			const company2Tenants = await tenantRepository.findByCompanyId(company2.id)

			expect(company1Tenants.length).toBe(1)
			expect(company2Tenants.length).toBe(1)
			expect(company1Tenants[0].id).toBe(tenant1.id)
			expect(company2Tenants[0].id).toBe(tenant2.id)
		})
	})

	describe('Campos Opcionais', () => {
		test('deve aceitar renda mensal zero (convertido para null)', async () => {
			const result = await useCase.execute({
				name: 'João Silva',
				cpf: '201.423.270-93',
				monthlyIncome: 0,
				createdBy: ownerUser,
			})

			// Nota: 0 é convertido para null devido ao uso de || no código
			expect(result.monthlyIncome).toBeNull()
		})

		test('deve aceitar strings vazias como null em campos opcionais', async () => {
			const result = await useCase.execute({
				name: 'João Silva',
				cpf: '813.308.654-05',
				address: '',
				city: '',
				employer: '',
				notes: '',
				createdBy: ownerUser,
			})

			expect(result.address).toBeNull()
			expect(result.city).toBeNull()
			expect(result.employer).toBeNull()
			expect(result.notes).toBeNull()
		})

		test('deve fazer trim de strings com espaços', async () => {
			const result = await useCase.execute({
				name: '  João Silva  ',
				cpf: '117.300.607-90',
				address: '  Rua Teste  ',
				city: '  São Paulo  ',
				employer: '  Empresa  ',
				createdBy: ownerUser,
			})

			expect(result.name).toBe('João Silva')
			expect(result.address).toBe('Rua Teste')
			expect(result.city).toBe('São Paulo')
			expect(result.employer).toBe('Empresa')
		})
	})
})
