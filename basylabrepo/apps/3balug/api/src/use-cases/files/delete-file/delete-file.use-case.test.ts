import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { IStorageService } from '@/services/storage'
import { DeleteFileUseCase } from './delete-file.use-case'

describe('DeleteFileUseCase', () => {
	let useCase: DeleteFileUseCase
	let mockStorageService: IStorageService

	beforeEach(() => {
		mockStorageService = {
			upload: mock(() =>
				Promise.resolve({ url: '', key: '', bucket: '', size: 0, contentType: '' }),
			),
			delete: mock(() => Promise.resolve()),
			getPresignedUrl: mock(() => Promise.resolve('https://storage.example.com/presigned')),
			exists: mock(() => Promise.resolve(true)),
		} as any

		useCase = new DeleteFileUseCase(mockStorageService)
	})

	describe('Casos de Sucesso', () => {
		test('deve excluir arquivo com sucesso', async () => {
			await useCase.execute({
				key: 'files/user-123/document.pdf',
				userId: 'user-123',
			})

			expect(mockStorageService.exists).toHaveBeenCalledTimes(1)
			expect(mockStorageService.exists).toHaveBeenCalledWith('files/user-123/document.pdf')
			expect(mockStorageService.delete).toHaveBeenCalledTimes(1)
			expect(mockStorageService.delete).toHaveBeenCalledWith('files/user-123/document.pdf')
		})

		test('deve excluir arquivo em subpasta (com fieldId)', async () => {
			await useCase.execute({
				key: 'files/user-456/field-abc/photo.jpg',
				userId: 'user-456',
			})

			expect(mockStorageService.exists).toHaveBeenCalledWith('files/user-456/field-abc/photo.jpg')
			expect(mockStorageService.delete).toHaveBeenCalledWith('files/user-456/field-abc/photo.jpg')
		})

		test('deve excluir arquivo com nome complexo', async () => {
			const complexKey = 'files/user-789/field-xyz/uuid-123_arquivo_com_nome_longo.pdf'

			await useCase.execute({
				key: complexKey,
				userId: 'user-789',
			})

			expect(mockStorageService.delete).toHaveBeenCalledWith(complexKey)
		})

		test('deve excluir múltiplos arquivos sequencialmente', async () => {
			await useCase.execute({
				key: 'files/user-123/file1.pdf',
				userId: 'user-123',
			})

			await useCase.execute({
				key: 'files/user-123/file2.jpg',
				userId: 'user-123',
			})

			await useCase.execute({
				key: 'files/user-123/file3.png',
				userId: 'user-123',
			})

			expect(mockStorageService.delete).toHaveBeenCalledTimes(3)
		})
	})

	describe('Validações de Segurança', () => {
		test('deve rejeitar exclusão de arquivo de outro usuário', async () => {
			await expect(
				useCase.execute({
					key: 'files/user-999/document.pdf',
					userId: 'user-123',
				}),
			).rejects.toThrow('Você não tem permissão para excluir este arquivo')

			expect(mockStorageService.delete).not.toHaveBeenCalled()
		})

		test('deve rejeitar exclusão de arquivo sem prefixo de userId', async () => {
			await expect(
				useCase.execute({
					key: 'public/document.pdf',
					userId: 'user-123',
				}),
			).rejects.toThrow('Você não tem permissão para excluir este arquivo')

			expect(mockStorageService.delete).not.toHaveBeenCalled()
		})

		test('deve rejeitar exclusão de arquivo com userId no meio do path mas não no formato correto', async () => {
			await expect(
				useCase.execute({
					key: 'other-folder/user-123/document.pdf',
					userId: 'user-123',
				}),
			).rejects.toThrow('Você não tem permissão para excluir este arquivo')

			expect(mockStorageService.delete).not.toHaveBeenCalled()
		})

		test('deve rejeitar chave vazia', async () => {
			await expect(
				useCase.execute({
					key: '',
					userId: 'user-123',
				}),
			).rejects.toThrow('Você não tem permissão para excluir este arquivo')
		})

		test('deve validar que o arquivo pertence ao usuário correto (case sensitive)', async () => {
			// userId em maiúscula na key, mas userId em minúscula no input
			await expect(
				useCase.execute({
					key: 'files/USER-123/document.pdf',
					userId: 'user-123',
				}),
			).rejects.toThrow('Você não tem permissão para excluir este arquivo')
		})
	})

	describe('Validações de Existência', () => {
		test('deve rejeitar exclusão de arquivo que não existe', async () => {
			mockStorageService.exists = mock(() => Promise.resolve(false))

			await expect(
				useCase.execute({
					key: 'files/user-123/nonexistent.pdf',
					userId: 'user-123',
				}),
			).rejects.toThrow('Arquivo não encontrado')

			expect(mockStorageService.exists).toHaveBeenCalledWith('files/user-123/nonexistent.pdf')
			expect(mockStorageService.delete).not.toHaveBeenCalled()
		})

		test('deve verificar existência antes de tentar deletar', async () => {
			let existsCallCount = 0
			let deleteCallCount = 0

			mockStorageService.exists = mock(async () => {
				existsCallCount++
				return true
			})

			mockStorageService.delete = mock(async () => {
				deleteCallCount++
				// Verificar que exists foi chamado antes de delete
				expect(existsCallCount).toBe(1)
			})

			await useCase.execute({
				key: 'files/user-123/document.pdf',
				userId: 'user-123',
			})

			expect(existsCallCount).toBe(1)
			expect(deleteCallCount).toBe(1)
		})
	})

	describe('Integração com StorageService', () => {
		test('deve propagar erro do storageService.exists', async () => {
			mockStorageService.exists = mock(() => Promise.reject(new Error('Storage connection failed')))

			await expect(
				useCase.execute({
					key: 'files/user-123/document.pdf',
					userId: 'user-123',
				}),
			).rejects.toThrow('Storage connection failed')

			expect(mockStorageService.delete).not.toHaveBeenCalled()
		})

		test('deve propagar erro do storageService.delete', async () => {
			mockStorageService.delete = mock(() => Promise.reject(new Error('Delete operation failed')))

			await expect(
				useCase.execute({
					key: 'files/user-123/document.pdf',
					userId: 'user-123',
				}),
			).rejects.toThrow('Delete operation failed')
		})

		test('deve chamar delete apenas uma vez por execução', async () => {
			await useCase.execute({
				key: 'files/user-123/document.pdf',
				userId: 'user-123',
			})

			expect(mockStorageService.delete).toHaveBeenCalledTimes(1)
		})
	})

	describe('Casos Edge', () => {
		test('deve aceitar userId com caracteres especiais', async () => {
			await useCase.execute({
				key: 'files/user-abc-123-xyz/document.pdf',
				userId: 'user-abc-123-xyz',
			})

			expect(mockStorageService.delete).toHaveBeenCalled()
		})

		test('deve aceitar arquivo com múltiplos pontos no nome', async () => {
			await useCase.execute({
				key: 'files/user-123/document.backup.v2.pdf',
				userId: 'user-123',
			})

			expect(mockStorageService.delete).toHaveBeenCalledWith(
				'files/user-123/document.backup.v2.pdf',
			)
		})

		test('deve aceitar arquivo em múltiplos níveis de subpastas', async () => {
			await useCase.execute({
				key: 'files/user-123/field-1/subfolder/deep/document.pdf',
				userId: 'user-123',
			})

			expect(mockStorageService.delete).toHaveBeenCalled()
		})
	})
})
