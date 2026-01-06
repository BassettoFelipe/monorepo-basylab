import { beforeEach, describe, expect, test } from 'bun:test'
import {
	BadRequestError,
	ForbiddenError,
	InternalServerError,
	NotFoundError,
} from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPES } from '@/db/schema/documents'
import type { PropertyOwner } from '@/db/schema/property-owners'
import type { Tenant } from '@/db/schema/tenants'
import type { User } from '@/db/schema/users'
import {
	InMemoryCompanyRepository,
	InMemoryDocumentRepository,
	InMemoryPropertyOwnerRepository,
	InMemoryTenantRepository,
	InMemoryUserRepository,
} from '@/test/mock-repository'
import { USER_ROLES } from '@/types/roles'
import { ListDocumentsUseCase } from './list-documents.use-case'

describe('ListDocumentsUseCase', () => {
	let useCase: ListDocumentsUseCase
	let documentRepository: InMemoryDocumentRepository
	let propertyOwnerRepository: InMemoryPropertyOwnerRepository
	let tenantRepository: InMemoryTenantRepository
	let userRepository: InMemoryUserRepository
	let companyRepository: InMemoryCompanyRepository

	let company: Company
	let ownerUser: User
	let managerUser: User
	let brokerUser: User
	let propertyOwner: PropertyOwner
	let tenant: Tenant

	beforeEach(async () => {
		// Setup repositories
		documentRepository = new InMemoryDocumentRepository()
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		tenantRepository = new InMemoryTenantRepository()
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()

		useCase = new ListDocumentsUseCase(
			documentRepository,
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

		propertyOwner = await propertyOwnerRepository.create({
			companyId: company.id,
			name: 'Property Owner',
			email: 'owner1@test.com',
			documentType: 'cpf',
			document: '12345678901',
			createdBy: ownerUser.id,
		})

		tenant = await tenantRepository.create({
			companyId: company.id,
			name: 'Tenant 1',
			email: 'tenant1@test.com',
			cpf: '98765432100',
			createdBy: ownerUser.id,
		})
	})

	describe('Casos de Sucesso', () => {
		test('deve listar documentos vazios quando não há documentos', async () => {
			const result = await useCase.execute({
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				user: ownerUser,
			})

			expect(result).toBeDefined()
			expect(result.documents).toEqual([])
			expect(result.total).toBe(0)
		})

		test('deve listar documentos de property owner', async () => {
			// Create documents
			const doc1 = await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				documentType: DOCUMENT_TYPES.RG,
				filename: 'rg.pdf',
				originalName: 'RG.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 500,
				url: 'https://storage.example.com/rg.pdf',
				description: 'RG frente',
				uploadedBy: ownerUser.id,
			})

			const doc2 = await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				documentType: DOCUMENT_TYPES.CPF,
				filename: 'cpf.pdf',
				originalName: 'CPF.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 300,
				url: 'https://storage.example.com/cpf.pdf',
				description: null,
				uploadedBy: ownerUser.id,
			})

			const result = await useCase.execute({
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				user: ownerUser,
			})

			expect(result.documents).toHaveLength(2)
			expect(result.total).toBe(2)
			expect(result.documents[0].id).toBe(doc1.id)
			expect(result.documents[0].documentType).toBe(DOCUMENT_TYPES.RG)
			expect(result.documents[0].description).toBe('RG frente')
			expect(result.documents[1].id).toBe(doc2.id)
			expect(result.documents[1].description).toBe(null)
		})

		test('deve listar documentos de tenant', async () => {
			await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.TENANT,
				entityId: tenant.id,
				documentType: DOCUMENT_TYPES.CPF,
				filename: 'cpf.pdf',
				originalName: 'CPF.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 300,
				url: 'https://storage.example.com/cpf.pdf',
				description: 'CPF do inquilino',
				uploadedBy: ownerUser.id,
			})

			const result = await useCase.execute({
				entityType: DOCUMENT_ENTITY_TYPES.TENANT,
				entityId: tenant.id,
				user: ownerUser,
			})

			expect(result.documents).toHaveLength(1)
			expect(result.total).toBe(1)
			expect(result.documents[0].entityType).toBe(DOCUMENT_ENTITY_TYPES.TENANT)
		})

		test('deve respeitar paginação com limit e offset', async () => {
			// Create 5 documents
			for (let i = 0; i < 5; i++) {
				await documentRepository.create({
					companyId: company.id,
					entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
					entityId: propertyOwner.id,
					documentType: DOCUMENT_TYPES.OUTROS,
					filename: `doc-${i}.pdf`,
					originalName: `Doc ${i}.pdf`,
					mimeType: 'application/pdf',
					size: 1024 * 100,
					url: `https://storage.example.com/doc-${i}.pdf`,
					description: null,
					uploadedBy: ownerUser.id,
				})
			}

			const result = await useCase.execute({
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				user: ownerUser,
				limit: 2,
				offset: 0,
			})

			expect(result.documents).toHaveLength(2)
			expect(result.total).toBe(5)
		})

		test('deve usar valores padrão de paginação (limit: 50, offset: 0)', async () => {
			await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				documentType: DOCUMENT_TYPES.RG,
				filename: 'rg.pdf',
				originalName: 'RG.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 500,
				url: 'https://storage.example.com/rg.pdf',
				description: null,
				uploadedBy: ownerUser.id,
			})

			const result = await useCase.execute({
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				user: ownerUser,
			})

			expect(result.documents).toHaveLength(1)
			expect(result.total).toBe(1)
		})

		test('deve permitir MANAGER listar documentos', async () => {
			await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				documentType: DOCUMENT_TYPES.RG,
				filename: 'rg.pdf',
				originalName: 'RG.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 500,
				url: 'https://storage.example.com/rg.pdf',
				description: null,
				uploadedBy: ownerUser.id,
			})

			const result = await useCase.execute({
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				user: managerUser,
			})

			expect(result.documents).toHaveLength(1)
		})

		test('deve permitir BROKER listar documentos de property owner criado por ele', async () => {
			const brokerOwner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: "Broker's Owner",
				email: 'brokerowner@test.com',
				documentType: 'cpf',
				document: '11122233344',
				createdBy: brokerUser.id,
			})

			await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: brokerOwner.id,
				documentType: DOCUMENT_TYPES.RG,
				filename: 'rg.pdf',
				originalName: 'RG.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 500,
				url: 'https://storage.example.com/rg.pdf',
				description: null,
				uploadedBy: brokerUser.id,
			})

			const result = await useCase.execute({
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: brokerOwner.id,
				user: brokerUser,
			})

			expect(result.documents).toHaveLength(1)
		})

		test('deve retornar todos os campos do documento corretamente', async () => {
			const doc = await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				documentType: DOCUMENT_TYPES.RG,
				filename: 'rg-123.pdf',
				originalName: 'RG Frente.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 500,
				url: 'https://storage.example.com/rg-123.pdf',
				description: 'RG frente e verso',
				uploadedBy: ownerUser.id,
			})

			const result = await useCase.execute({
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				user: ownerUser,
			})

			expect(result.documents[0].id).toBe(doc.id)
			expect(result.documents[0].entityType).toBe(DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER)
			expect(result.documents[0].entityId).toBe(propertyOwner.id)
			expect(result.documents[0].documentType).toBe(DOCUMENT_TYPES.RG)
			expect(result.documents[0].filename).toBe('rg-123.pdf')
			expect(result.documents[0].originalName).toBe('RG Frente.pdf')
			expect(result.documents[0].mimeType).toBe('application/pdf')
			expect(result.documents[0].size).toBe(1024 * 500)
			expect(result.documents[0].url).toBe('https://storage.example.com/rg-123.pdf')
			expect(result.documents[0].description).toBe('RG frente e verso')
			expect(result.documents[0].createdAt).toBeInstanceOf(Date)
		})
	})

	describe('Validações de Permissão', () => {
		test('deve lançar erro para role não autorizada', async () => {
			const insuranceAnalyst = await userRepository.create({
				name: 'Insurance Analyst',
				email: 'analyst@test.com',
				password: 'password',
				role: USER_ROLES.INSURANCE_ANALYST,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
					entityId: propertyOwner.id,
					user: insuranceAnalyst,
				}),
			).rejects.toThrow(new ForbiddenError('Voce nao tem permissao para listar documentos.'))
		})

		test('deve lançar erro quando usuário não tem empresa vinculada', async () => {
			const userWithoutCompany = await userRepository.create({
				name: 'No Company User',
				email: 'nocompany@test.com',
				password: 'password',
				role: USER_ROLES.OWNER,
				companyId: null,
				isActive: true,
				isEmailVerified: true,
			})

			await expect(
				useCase.execute({
					entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
					entityId: propertyOwner.id,
					user: userWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuario sem empresa vinculada.'))
		})

		test('deve lançar erro quando BROKER tenta listar documentos de property owner de outro broker', async () => {
			await expect(
				useCase.execute({
					entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
					entityId: propertyOwner.id, // Created by ownerUser
					user: brokerUser,
				}),
			).rejects.toThrow(
				new ForbiddenError('Voce so pode ver documentos de proprietarios que voce cadastrou.'),
			)
		})

		test('deve lançar erro quando BROKER tenta listar documentos de tenant de outro broker', async () => {
			await expect(
				useCase.execute({
					entityType: DOCUMENT_ENTITY_TYPES.TENANT,
					entityId: tenant.id, // Created by ownerUser
					user: brokerUser,
				}),
			).rejects.toThrow(
				new ForbiddenError('Voce so pode ver documentos de inquilinos que voce cadastrou.'),
			)
		})
	})

	describe('Validações de Dados', () => {
		test('deve lançar erro para tipo de entidade inválido', async () => {
			await expect(
				useCase.execute({
					entityType: 'invalid_entity' as any,
					entityId: propertyOwner.id,
					user: ownerUser,
				}),
			).rejects.toThrow(BadRequestError)
		})

		test('deve lançar erro quando property owner não existe', async () => {
			await expect(
				useCase.execute({
					entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
					entityId: 'non-existent-id',
					user: ownerUser,
				}),
			).rejects.toThrow(new NotFoundError('Proprietario nao encontrado.'))
		})

		test('deve lançar erro quando tenant não existe', async () => {
			await expect(
				useCase.execute({
					entityType: DOCUMENT_ENTITY_TYPES.TENANT,
					entityId: 'non-existent-id',
					user: ownerUser,
				}),
			).rejects.toThrow(new NotFoundError('Inquilino nao encontrado.'))
		})
	})

	describe('Isolamento por Empresa', () => {
		test('deve lançar erro quando property owner pertence a outra empresa', async () => {
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

			const propertyOwner2 = await propertyOwnerRepository.create({
				companyId: company2.id,
				name: 'Property Owner 2',
				email: 'owner2data@test.com',
				documentType: 'cpf',
				document: '99988877766',
				createdBy: owner2.id,
			})

			await expect(
				useCase.execute({
					entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
					entityId: propertyOwner2.id,
					user: ownerUser, // From company1
				}),
			).rejects.toThrow(new ForbiddenError('Proprietario nao pertence a sua empresa.'))
		})

		test('deve lançar erro quando tenant pertence a outra empresa', async () => {
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

			const tenant2 = await tenantRepository.create({
				companyId: company2.id,
				name: 'Tenant 2',
				email: 'tenant2@test.com',
				cpf: '11122233344',
				createdBy: owner2.id,
			})

			await expect(
				useCase.execute({
					entityType: DOCUMENT_ENTITY_TYPES.TENANT,
					entityId: tenant2.id,
					user: ownerUser, // From company1
				}),
			).rejects.toThrow(new ForbiddenError('Inquilino nao pertence a sua empresa.'))
		})
	})
})
