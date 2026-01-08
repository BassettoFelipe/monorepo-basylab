import { beforeEach, describe, expect, test } from 'bun:test'
import { ForbiddenError, InternalServerError, NotFoundError } from '@basylab/core/errors'
import type { Company } from '@/db/schema/companies'
import type { Document } from '@/db/schema/documents'
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
import { RemoveDocumentUseCase } from './remove-document.use-case'

describe('RemoveDocumentUseCase', () => {
	let useCase: RemoveDocumentUseCase
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
	let document: Document

	beforeEach(async () => {
		// Setup repositories
		documentRepository = new InMemoryDocumentRepository()
		propertyOwnerRepository = new InMemoryPropertyOwnerRepository()
		tenantRepository = new InMemoryTenantRepository()
		userRepository = new InMemoryUserRepository()
		companyRepository = new InMemoryCompanyRepository()

		useCase = new RemoveDocumentUseCase(
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

		document = await documentRepository.create({
			companyId: company.id,
			entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
			entityId: propertyOwner.id,
			documentType: DOCUMENT_TYPES.RG,
			filename: 'rg-123.pdf',
			originalName: 'RG.pdf',
			mimeType: 'application/pdf',
			size: 1024 * 500,
			url: 'https://storage.example.com/rg-123.pdf',
			description: 'RG frente',
			uploadedBy: ownerUser.id,
		})
	})

	describe('Casos de Sucesso', () => {
		test('deve remover documento com sucesso (soft delete)', async () => {
			const result = await useCase.execute({
				documentId: document.id,
				user: ownerUser,
			})

			expect(result.success).toBe(true)
			expect(result.message).toBe('Documento removido com sucesso.')

			// Verify document was soft deleted (not visible in findById active filter)
			const docs = await documentRepository.findByEntity(
				DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				propertyOwner.id,
			)
			expect(docs.find((d) => d.id === document.id)).toBeUndefined()

			// Verify document still exists but with deletedAt set
			const rawDoc = documentRepository.documents.get(document.id)
			expect(rawDoc).toBeDefined()
			expect(rawDoc?.deletedAt).not.toBeNull()
			expect(rawDoc?.deletedBy).toBe(ownerUser.id)
		})

		test('deve permitir MANAGER remover documento', async () => {
			const result = await useCase.execute({
				documentId: document.id,
				user: managerUser,
			})

			expect(result.success).toBe(true)

			// Verify soft delete
			const rawDoc = documentRepository.documents.get(document.id)
			expect(rawDoc?.deletedAt).not.toBeNull()
			expect(rawDoc?.deletedBy).toBe(managerUser.id)
		})

		test('deve permitir BROKER remover documento de property owner criado por ele', async () => {
			const brokerOwner = await propertyOwnerRepository.create({
				companyId: company.id,
				name: "Broker's Owner",
				email: 'brokerowner@test.com',
				documentType: 'cpf',
				document: '11122233344',
				createdBy: brokerUser.id,
			})

			const brokerDoc = await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: brokerOwner.id,
				documentType: DOCUMENT_TYPES.RG,
				filename: 'broker-rg.pdf',
				originalName: 'RG.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 500,
				url: 'https://storage.example.com/broker-rg.pdf',
				description: null,
				uploadedBy: brokerUser.id,
			})

			const result = await useCase.execute({
				documentId: brokerDoc.id,
				user: brokerUser,
			})

			expect(result.success).toBe(true)
		})

		test('deve permitir BROKER remover documento de tenant criado por ele', async () => {
			const brokerTenant = await tenantRepository.create({
				companyId: company.id,
				name: "Broker's Tenant",
				email: 'brokertenant@test.com',
				cpf: '55566677788',
				createdBy: brokerUser.id,
			})

			const brokerDoc = await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.TENANT,
				entityId: brokerTenant.id,
				documentType: DOCUMENT_TYPES.CPF,
				filename: 'broker-cpf.pdf',
				originalName: 'CPF.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 300,
				url: 'https://storage.example.com/broker-cpf.pdf',
				description: null,
				uploadedBy: brokerUser.id,
			})

			const result = await useCase.execute({
				documentId: brokerDoc.id,
				user: brokerUser,
			})

			expect(result.success).toBe(true)
		})

		test('deve remover múltiplos documentos sequencialmente', async () => {
			const doc2 = await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				documentType: DOCUMENT_TYPES.CPF,
				filename: 'cpf-456.pdf',
				originalName: 'CPF.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 300,
				url: 'https://storage.example.com/cpf-456.pdf',
				description: null,
				uploadedBy: ownerUser.id,
			})

			const result1 = await useCase.execute({
				documentId: document.id,
				user: ownerUser,
			})

			const result2 = await useCase.execute({
				documentId: doc2.id,
				user: ownerUser,
			})

			expect(result1.success).toBe(true)
			expect(result2.success).toBe(true)

			// Both should be soft deleted
			const rawDoc1 = documentRepository.documents.get(document.id)
			const rawDoc2 = documentRepository.documents.get(doc2.id)
			expect(rawDoc1?.deletedAt).not.toBeNull()
			expect(rawDoc2?.deletedAt).not.toBeNull()
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
					documentId: document.id,
					user: insuranceAnalyst,
				}),
			).rejects.toThrow(new ForbiddenError('Voce nao tem permissao para remover documentos.'))
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
					documentId: document.id,
					user: userWithoutCompany,
				}),
			).rejects.toThrow(new InternalServerError('Usuario sem empresa vinculada.'))
		})

		test('deve lançar erro quando BROKER tenta remover documento de property owner de outro broker', async () => {
			await expect(
				useCase.execute({
					documentId: document.id, // Created for propertyOwner by ownerUser
					user: brokerUser,
				}),
			).rejects.toThrow(
				new ForbiddenError('Voce so pode remover documentos de proprietarios que voce cadastrou.'),
			)
		})

		test('deve lançar erro quando BROKER tenta remover documento de tenant de outro broker', async () => {
			const tenantDoc = await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.TENANT,
				entityId: tenant.id,
				documentType: DOCUMENT_TYPES.CPF,
				filename: 'tenant-cpf.pdf',
				originalName: 'CPF.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 300,
				url: 'https://storage.example.com/tenant-cpf.pdf',
				description: null,
				uploadedBy: ownerUser.id,
			})

			await expect(
				useCase.execute({
					documentId: tenantDoc.id, // For tenant created by ownerUser
					user: brokerUser,
				}),
			).rejects.toThrow(
				new ForbiddenError('Voce so pode remover documentos de inquilinos que voce cadastrou.'),
			)
		})
	})

	describe('Validações de Dados', () => {
		test('deve lançar erro quando documento não existe', async () => {
			await expect(
				useCase.execute({
					documentId: 'non-existent-id',
					user: ownerUser,
				}),
			).rejects.toThrow(new NotFoundError('Documento nao encontrado.'))
		})

		test('deve lançar erro quando documento pertence a outra empresa', async () => {
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

			const doc2 = await documentRepository.create({
				companyId: company2.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner2.id,
				documentType: DOCUMENT_TYPES.RG,
				filename: 'rg-company2.pdf',
				originalName: 'RG.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 500,
				url: 'https://storage.example.com/rg-company2.pdf',
				description: null,
				uploadedBy: owner2.id,
			})

			await expect(
				useCase.execute({
					documentId: doc2.id,
					user: ownerUser, // From company1
				}),
			).rejects.toThrow(new ForbiddenError('Documento nao pertence a sua empresa.'))
		})
	})

	describe('Integridade de Dados', () => {
		test('deve remover apenas o documento especificado', async () => {
			const doc2 = await documentRepository.create({
				companyId: company.id,
				entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				entityId: propertyOwner.id,
				documentType: DOCUMENT_TYPES.CPF,
				filename: 'cpf-789.pdf',
				originalName: 'CPF.pdf',
				mimeType: 'application/pdf',
				size: 1024 * 300,
				url: 'https://storage.example.com/cpf-789.pdf',
				description: null,
				uploadedBy: ownerUser.id,
			})

			await useCase.execute({
				documentId: document.id,
				user: ownerUser,
			})

			// Doc 1 should be soft deleted
			const rawDoc1 = documentRepository.documents.get(document.id)
			expect(rawDoc1?.deletedAt).not.toBeNull()

			// Doc 2 should still be active (not deleted)
			const rawDoc2 = documentRepository.documents.get(doc2.id)
			expect(rawDoc2?.deletedAt).toBeNull()

			// Doc 2 should still be visible in active documents
			const activeDocs = await documentRepository.findByEntity(
				DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
				propertyOwner.id,
			)
			expect(activeDocs.find((d) => d.id === doc2.id)).toBeDefined()
		})
	})
})
