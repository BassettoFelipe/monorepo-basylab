import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { NotFoundError } from '@basylab/core'
import type { IPropertyOwnerRepository } from '@/repositories/contracts/property-owner.repository'
import type { IPropertyRepository } from '@/repositories/contracts/property.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IStorageService } from '@/services/storage'
import { GetPresignedUrlUseCase } from './get-presigned-url.use-case'

describe('GetPresignedUrlUseCase', () => {
	let useCase: GetPresignedUrlUseCase
	let mockStorageService: IStorageService
	let mockTenantRepository: ITenantRepository
	let mockPropertyOwnerRepository: IPropertyOwnerRepository
	let mockPropertyRepository: IPropertyRepository
	let mockUserRepository: IUserRepository

	const tenantId = 'tenant-123'
	const propertyOwnerId = 'owner-123'
	const propertyId = 'property-123'
	const userId = 'user-123'

	beforeEach(() => {
		const futureDate = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos no futuro

		mockStorageService = {
			upload: mock(() =>
				Promise.resolve({ url: '', key: '', bucket: '', size: 0, contentType: '' }),
			),
			delete: mock(() => Promise.resolve()),
			getPresignedUrl: mock(() => Promise.resolve('https://storage.example.com/presigned')),
			getPresignedUploadUrl: mock((key: string) =>
				Promise.resolve({
					url: `https://storage.example.com/upload?key=${key}`,
					key,
					expiresAt: futureDate,
				}),
			),
			getPublicUrl: mock((key: string) => `https://storage.example.com/public/${key}`),
		} as any

		mockTenantRepository = {
			findById: mock(() => Promise.resolve({ id: tenantId, name: 'Test Tenant' })),
		} as any

		mockPropertyOwnerRepository = {
			findById: mock(() => Promise.resolve({ id: propertyOwnerId, name: 'Test Owner' })),
		} as any

		mockPropertyRepository = {
			findById: mock(() => Promise.resolve({ id: propertyId, title: 'Test Property' })),
		} as any

		mockUserRepository = {
			findById: mock(() => Promise.resolve({ id: userId, name: 'Test User' })),
		} as any

		useCase = new GetPresignedUrlUseCase({
			storageService: mockStorageService,
			tenantRepository: mockTenantRepository,
			propertyOwnerRepository: mockPropertyOwnerRepository,
			propertyRepository: mockPropertyRepository,
			userRepository: mockUserRepository,
		})
	})

	describe('Validacao de Entidade', () => {
		test('deve rejeitar quando tenant nao existe', async () => {
			mockTenantRepository.findById = mock(() => Promise.resolve(null))

			await expect(
				useCase.execute({
					fileName: 'foto.jpg',
					contentType: 'image/jpeg',
					userId: 'user-123',
					entityType: 'tenant',
					entityId: 'invalid-tenant',
				}),
			).rejects.toThrow(NotFoundError)
		})

		test('deve rejeitar quando property_owner nao existe', async () => {
			mockPropertyOwnerRepository.findById = mock(() => Promise.resolve(null))

			await expect(
				useCase.execute({
					fileName: 'foto.jpg',
					contentType: 'image/jpeg',
					userId: 'user-123',
					entityType: 'property_owner',
					entityId: 'invalid-owner',
				}),
			).rejects.toThrow(NotFoundError)
		})

		test('deve rejeitar quando property nao existe', async () => {
			mockPropertyRepository.findById = mock(() => Promise.resolve(null))

			await expect(
				useCase.execute({
					fileName: 'foto.jpg',
					contentType: 'image/jpeg',
					userId: 'user-123',
					entityType: 'property',
					entityId: 'invalid-property',
				}),
			).rejects.toThrow(NotFoundError)
		})

		test('deve rejeitar quando user nao existe', async () => {
			mockUserRepository.findById = mock(() => Promise.resolve(null))

			await expect(
				useCase.execute({
					fileName: 'foto.jpg',
					contentType: 'image/jpeg',
					userId: 'user-123',
					entityType: 'user',
					entityId: 'invalid-user',
				}),
			).rejects.toThrow(NotFoundError)
		})

		test('deve aceitar quando tenant existe', async () => {
			const result = await useCase.execute({
				fileName: 'foto.jpg',
				contentType: 'image/jpeg',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
			})

			expect(result).toBeDefined()
			expect(result.key).toContain('tenant')
			expect(result.key).toContain(tenantId)
		})

		test('deve aceitar quando property_owner existe', async () => {
			const result = await useCase.execute({
				fileName: 'foto.jpg',
				contentType: 'image/jpeg',
				userId: 'user-123',
				entityType: 'property_owner',
				entityId: propertyOwnerId,
			})

			expect(result).toBeDefined()
			expect(result.key).toContain('property_owner')
			expect(result.key).toContain(propertyOwnerId)
		})

		test('deve aceitar quando property existe', async () => {
			const result = await useCase.execute({
				fileName: 'foto.jpg',
				contentType: 'image/jpeg',
				userId: 'user-123',
				entityType: 'property',
				entityId: propertyId,
			})

			expect(result).toBeDefined()
			expect(result.key).toContain('property')
			expect(result.key).toContain(propertyId)
		})

		test('deve aceitar quando user existe', async () => {
			const result = await useCase.execute({
				fileName: 'foto.jpg',
				contentType: 'image/jpeg',
				userId: 'user-123',
				entityType: 'user',
				entityId: userId,
			})

			expect(result).toBeDefined()
			expect(result.key).toContain('user')
			expect(result.key).toContain(userId)
		})
	})

	describe('Casos de Sucesso', () => {
		test('deve gerar URL pre-assinada para upload de PDF', async () => {
			const result = await useCase.execute({
				fileName: 'documento.pdf',
				contentType: 'application/pdf',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
			})

			expect(result).toBeDefined()
			expect(result.uploadUrl).toContain('https://storage.example.com/upload')
			expect(result.key).toContain('files/user-123/tenant/')
			expect(result.key).toContain('documento.pdf')
			expect(result.publicUrl).toContain('https://storage.example.com/public/')
			expect(result.expiresAt).toBeInstanceOf(Date)
			expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
			expect(mockStorageService.getPresignedUploadUrl).toHaveBeenCalledTimes(1)
		})

		test('deve gerar URL pre-assinada para upload de imagem', async () => {
			const result = await useCase.execute({
				fileName: 'foto.jpg',
				contentType: 'image/jpeg',
				userId: 'user-456',
				entityType: 'property',
				entityId: propertyId,
			})

			expect(result.key).toContain('files/user-456/property/')
			expect(result.key).toContain('foto.jpg')
		})

		test('deve organizar arquivo em pasta com fieldId quando fornecido', async () => {
			const result = await useCase.execute({
				fileName: 'arquivo.pdf',
				contentType: 'application/pdf',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
				fieldId: 'photo',
			})

			expect(result.key).toContain(`files/user-123/tenant/${tenantId}/photo/`)
			expect(result.publicUrl).toContain(`files/user-123/tenant/${tenantId}/photo/`)
		})

		test('deve sanitizar nome de arquivo com caracteres especiais', async () => {
			const result = await useCase.execute({
				fileName: 'Arquivo com Espacos!.pdf',
				contentType: 'application/pdf',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
			})

			expect(result.key).toContain('Arquivo_com_Espacos_')
		})

		test('deve remover acentos do nome do arquivo', async () => {
			const result = await useCase.execute({
				fileName: 'relatorio-sao.pdf',
				contentType: 'application/pdf',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
			})

			expect(result.key).toContain('relatorio-sao.pdf')
		})
	})

	describe('Validacoes de Tipo de Arquivo', () => {
		test('deve rejeitar arquivo com tipo nao permitido', async () => {
			await expect(
				useCase.execute({
					fileName: 'arquivo.pdf',
					contentType: 'application/pdf',
					userId: 'user-123',
					entityType: 'tenant',
					entityId: tenantId,
					allowedTypes: ['image/jpeg', 'image/png'],
				}),
			).rejects.toThrow('Tipo de arquivo não permitido. Tipos aceitos: image/jpeg, image/png')
		})

		test('deve aceitar arquivo com tipo permitido', async () => {
			const result = await useCase.execute({
				fileName: 'imagem.jpg',
				contentType: 'image/jpeg',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
				allowedTypes: ['image/jpeg', 'image/png'],
			})

			expect(result).toBeDefined()
		})

		test('deve aceitar arquivo com wildcard de tipo (image/*)', async () => {
			const result = await useCase.execute({
				fileName: 'foto.jpg',
				contentType: 'image/jpeg',
				userId: 'user-123',
				entityType: 'property',
				entityId: propertyId,
				allowedTypes: ['image/*'],
			})
			expect(result.key).toContain('foto.jpg')
		})

		test('deve aceitar arquivo quando allowedTypes nao e fornecido', async () => {
			const result = await useCase.execute({
				fileName: 'qualquer-arquivo.xyz',
				contentType: 'application/octet-stream',
				userId: 'user-123',
				entityType: 'user',
				entityId: userId,
			})

			expect(result).toBeDefined()
		})
	})

	describe('Geracao de Chave Unica', () => {
		test('deve gerar chaves unicas para multiplas requisicoes do mesmo arquivo', async () => {
			const result1 = await useCase.execute({
				fileName: 'arquivo.pdf',
				contentType: 'application/pdf',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
			})

			const result2 = await useCase.execute({
				fileName: 'arquivo.pdf',
				contentType: 'application/pdf',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
			})

			expect(result1.key).not.toBe(result2.key)
		})

		test('deve incluir entityType e entityId na chave do arquivo', async () => {
			const result = await useCase.execute({
				fileName: 'arquivo.pdf',
				contentType: 'application/pdf',
				userId: 'user-999',
				entityType: 'property_owner',
				entityId: propertyOwnerId,
			})

			expect(result.key).toContain('files/user-999/property_owner/')
			expect(result.key).toContain(propertyOwnerId)
		})
	})

	describe('Integracao com StorageService', () => {
		test('deve chamar getPresignedUploadUrl com parametros corretos', async () => {
			await useCase.execute({
				fileName: 'documento.pdf',
				contentType: 'application/pdf',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
				fieldId: 'photo',
			})

			expect(mockStorageService.getPresignedUploadUrl).toHaveBeenCalledTimes(1)
			const call = (mockStorageService.getPresignedUploadUrl as any).mock.calls[0]
			expect(call[0]).toContain(`files/user-123/tenant/${tenantId}/photo/`)
			expect(call[1]).toBe('application/pdf')
			expect(call[2]).toBe(300)
		})

		test('deve retornar todos os campos necessarios no output', async () => {
			const result = await useCase.execute({
				fileName: 'test.pdf',
				contentType: 'application/pdf',
				userId: 'user-123',
				entityType: 'tenant',
				entityId: tenantId,
			})

			expect(result.uploadUrl).toBeDefined()
			expect(result.key).toBeDefined()
			expect(result.publicUrl).toBeDefined()
			expect(result.expiresAt).toBeDefined()
			expect(typeof result.uploadUrl).toBe('string')
			expect(typeof result.key).toBe('string')
			expect(typeof result.publicUrl).toBe('string')
			expect(result.expiresAt).toBeInstanceOf(Date)
		})
	})
})
