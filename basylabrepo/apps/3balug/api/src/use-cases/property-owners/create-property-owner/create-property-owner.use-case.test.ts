import { beforeEach, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { ContactValidator, DocumentValidator } from '@basylab/core/validation'
import type { Company } from '@/db/schema/companies'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryPropertyOwnerRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { CreatePropertyOwnerUseCase } from './create-property-owner.use-case'

describe('CreatePropertyOwnerUseCase', () => {
	let useCase: CreatePropertyOwnerUseCase
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository
	let documentValidator: DocumentValidator
	let contactValidator: ContactValidator

	let ownerUser: User
	let company: Company

	beforeEach(async () => {
		// Setup repositories
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()

		// Setup services
		documentValidator = new DocumentValidator()
		contactValidator = new ContactValidator()

		// Create use case
		useCase = new CreatePropertyOwnerUseCase(
			propertyOwnerRepository,
			documentValidator,
			contactValidator,
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

	describe('Caso de Sucesso', () => {
		test('deve criar um proprietário pessoa física com dados completos', async () => {
			const result = await useCase.execute({
				name: 'João Silva Proprietário',
				documentType: 'cpf',
				document: '811.058.504-39',
				email: 'joao.owner@example.com',
				phone: '(11) 99999-9999',
				address: 'Rua dos Proprietários, 123',
				city: 'São Paulo',
				state: 'sp',
				zipCode: '01234-567',
				birthDate: '1970-05-15',
				notes: 'Proprietário VIP',
				createdBy: ownerUser,
			})

			expect(result).toBeDefined()
			expect(result.id).toBeDefined()
			expect(result.companyId).toBe(company.id)
			expect(result.name).toBe('João Silva Proprietário')
			expect(result.documentType).toBe('cpf')
			expect(result.document).toBe('81105850439')
			expect(result.email).toBe('joao.owner@example.com')
			expect(result.phone).toBe('11999999999')
			expect(result.address).toBe('Rua dos Proprietários, 123')
			expect(result.city).toBe('São Paulo')
			expect(result.state).toBe('SP')
			expect(result.zipCode).toBe('01234567')
			expect(result.birthDate).toBe('1970-05-15')
			expect(result.notes).toBe('Proprietário VIP')
			expect(result.createdAt).toBeDefined()
		})

		test('deve criar um proprietário pessoa jurídica com CNPJ', async () => {
			const result = await useCase.execute({
				name: 'Imobiliária XYZ LTDA',
				documentType: 'cnpj',
				document: '11.222.333/0001-81',
				email: 'contato@imobiliaria.com',
				phone: '(11) 3333-4444',
				address: 'Av. Paulista, 1000',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01310-100',
				notes: 'Imobiliária parceira',
				createdBy: ownerUser,
			})

			expect(result).toBeDefined()
			expect(result.documentType).toBe('cnpj')
			expect(result.document).toBe('11222333000181')
			expect(result.name).toBe('Imobiliária XYZ LTDA')
		})

		test('deve criar um proprietário sem campos opcionais', async () => {
			const result = await useCase.execute({
				name: 'Maria Santos',
				documentType: 'cpf',
				document: '996.908.529-81',
				createdBy: ownerUser,
			})

			expect(result).toBeDefined()
			expect(result.name).toBe('Maria Santos')
			expect(result.document).toBe('99690852981')
			expect(result.email).toBeNull()
			expect(result.phone).toBeNull()
			expect(result.address).toBeNull()
			expect(result.city).toBeNull()
			expect(result.state).toBeNull()
			expect(result.zipCode).toBeNull()
			expect(result.birthDate).toBeNull()
			expect(result.notes).toBeNull()
		})
	})

	describe('Validação de Usuário sem Empresa', () => {
		test('deve lançar erro quando usuário não tem empresa vinculada', async () => {
			const userWithoutCompany = await userRepository.create({
				email: 'nocompany@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'User Without Company',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					name: 'Test Owner',
					documentType: 'cpf',
					document: '811.058.504-39',
					createdBy: userWithoutCompany,
				}),
			).rejects.toThrow('Usuário sem empresa vinculada')
		})
	})

	describe('Validação de Documento Duplicado', () => {
		test('deve lançar erro quando CPF já existe na mesma empresa', async () => {
			await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Existing Owner',
				documentType: 'cpf',
				document: '81105850439',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					name: 'New Owner',
					documentType: 'cpf',
					document: '811.058.504-39',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Já existe um proprietário cadastrado com este documento')
		})

		test('deve lançar erro quando CNPJ já existe na mesma empresa', async () => {
			await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Existing Company',
				documentType: 'cnpj',
				document: '11222333000181',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					name: 'New Company',
					documentType: 'cnpj',
					document: '11.222.333/0001-81',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Já existe um proprietário cadastrado com este documento')
		})

		test('deve permitir mesmo CPF em empresas diferentes', async () => {
			// Create another company
			const anotherOwner = await userRepository.create({
				email: 'another@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Another Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			const anotherCompany = await companyRepository.create({
				name: 'Another Company',
				ownerId: anotherOwner.id,
				email: 'another@test.com',
			})

			await userRepository.update(anotherOwner.id, {
				companyId: anotherCompany.id,
			})

			// Create property owner in first company
			await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Owner 1',
				documentType: 'cpf',
				document: '81105850439',
				createdBy: ownerUser.id,
			})

			// Should allow same CPF in another company
			const updatedAnotherOwner = (await userRepository.findById(anotherOwner.id)) as User

			const result = await useCase.execute({
				name: 'Owner 2',
				documentType: 'cpf',
				document: '811.058.504-39',
				createdBy: updatedAnotherOwner,
			})

			expect(result).toBeDefined()
			expect(result.document).toBe('81105850439')
			expect(result.companyId).toBe(anotherCompany.id)
		})
	})

	describe('Validação de Documento Inválido', () => {
		test('deve lançar erro quando CPF é inválido', async () => {
			await expect(
				useCase.execute({
					name: 'Test Owner',
					documentType: 'cpf',
					document: '111.111.111-11',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('CPF inválido')
		})

		test('deve lançar erro quando CNPJ é inválido', async () => {
			await expect(
				useCase.execute({
					name: 'Test Company',
					documentType: 'cnpj',
					document: '11.111.111/1111-11',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('CNPJ inválido')
		})
	})

	describe('Validação de Email Duplicado', () => {
		test('deve lançar erro quando email já existe na mesma empresa', async () => {
			await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Owner 1',
				documentType: 'cpf',
				document: '81105850439',
				email: 'duplicate@test.com',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					name: 'Owner 2',
					documentType: 'cpf',
					document: '788.647.067-20',
					email: 'duplicate@test.com',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Já existe um proprietário cadastrado com este e-mail')
		})

		test('deve validar email case-insensitive', async () => {
			await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Owner 1',
				documentType: 'cpf',
				document: '81105850439',
				email: 'TEST@example.com',
				createdBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					name: 'Owner 2',
					documentType: 'cpf',
					document: '788.647.067-20',
					email: 'test@example.com',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('Já existe um proprietário cadastrado com este e-mail')
		})

		test('deve permitir mesmo email em empresas diferentes', async () => {
			// Create another company
			const anotherOwner = await userRepository.create({
				email: 'another@test.com',
				password: await PasswordUtils.hash('Test@123'),
				name: 'Another Owner',
				role: USER_ROLES.OWNER,
				isActive: true,
				isEmailVerified: true,
			})

			const anotherCompany = await companyRepository.create({
				name: 'Another Company',
				ownerId: anotherOwner.id,
				email: 'another@test.com',
			})

			await userRepository.update(anotherOwner.id, {
				companyId: anotherCompany.id,
			})

			// Create property owner in first company
			await propertyOwnerRepository.create({
				companyId: company.id,
				name: 'Owner 1',
				documentType: 'cpf',
				document: '81105850439',
				email: 'same@test.com',
				createdBy: ownerUser.id,
			})

			// Should allow same email in another company
			const updatedAnotherOwner = (await userRepository.findById(anotherOwner.id)) as User

			const result = await useCase.execute({
				name: 'Owner 2',
				documentType: 'cpf',
				document: '930.137.927-95',
				email: 'same@test.com',
				createdBy: updatedAnotherOwner,
			})

			expect(result).toBeDefined()
			expect(result.email).toBe('same@test.com')
			expect(result.companyId).toBe(anotherCompany.id)
		})
	})

	describe('Validação de Email Inválido', () => {
		test('deve lançar erro quando email é inválido', async () => {
			await expect(
				useCase.execute({
					name: 'Test Owner',
					documentType: 'cpf',
					document: '811.058.504-39',
					email: 'invalid-email',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('E-mail inválido')
		})

		test('deve lançar erro quando email não tem domínio', async () => {
			await expect(
				useCase.execute({
					name: 'Test Owner',
					documentType: 'cpf',
					document: '811.058.504-39',
					email: 'test@',
					createdBy: ownerUser,
				}),
			).rejects.toThrow('E-mail inválido')
		})

		test('deve aceitar email vazio e converter para null', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '201.423.270-93',
				email: '',
				createdBy: ownerUser,
			})

			expect(result.email).toBeNull()
		})
	})

	describe('Normalização de Dados', () => {
		test('deve normalizar CPF removendo pontuação', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '811.058.504-39',
				createdBy: ownerUser,
			})

			expect(result.document).toBe('81105850439')
		})

		test('deve normalizar CNPJ removendo pontuação', async () => {
			const result = await useCase.execute({
				name: 'Test Company',
				documentType: 'cnpj',
				document: '11.222.333/0001-81',
				createdBy: ownerUser,
			})

			expect(result.document).toBe('11222333000181')
		})

		test('deve normalizar email para lowercase', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '811.058.504-39',
				email: 'TEST@EXAMPLE.COM',
				createdBy: ownerUser,
			})

			expect(result.email).toBe('test@example.com')
		})

		test('deve normalizar telefone removendo pontuação', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '811.058.504-39',
				phone: '(11) 99999-9999',
				createdBy: ownerUser,
			})

			expect(result.phone).toBe('11999999999')
		})

		test('deve normalizar CEP removendo pontuação', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '811.058.504-39',
				zipCode: '01234-567',
				createdBy: ownerUser,
			})

			expect(result.zipCode).toBe('01234567')
		})

		test('deve normalizar estado para uppercase', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '811.058.504-39',
				state: 'sp',
				createdBy: ownerUser,
			})

			expect(result.state).toBe('SP')
		})
	})

	describe('Campos Opcionais', () => {
		test('deve converter string vazia em null para address', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '813.308.654-05',
				address: '   ',
				createdBy: ownerUser,
			})

			expect(result.address).toBeNull()
		})

		test('deve converter string vazia em null para city', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '117.300.607-90',
				city: '   ',
				createdBy: ownerUser,
			})

			expect(result.city).toBeNull()
		})

		test('deve converter string vazia em null para notes', async () => {
			const result = await useCase.execute({
				name: 'Test Owner',
				documentType: 'cpf',
				document: '440.505.205-08',
				notes: '   ',
				createdBy: ownerUser,
			})

			expect(result.notes).toBeNull()
		})

		test('deve fazer trim em todos os campos de texto', async () => {
			const result = await useCase.execute({
				name: '  Test Owner  ',
				documentType: 'cpf',
				document: '577.331.288-38',
				address: '  Rua Teste  ',
				city: '  São Paulo  ',
				notes: '  Some notes  ',
				createdBy: ownerUser,
			})

			expect(result.name).toBe('Test Owner')
			expect(result.address).toBe('Rua Teste')
			expect(result.city).toBe('São Paulo')
			expect(result.notes).toBe('Some notes')
		})
	})
})
