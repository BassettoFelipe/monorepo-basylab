import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { BadRequestError } from '@basylab/core/errors'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IStorageService } from '@/services/storage'
import { DeleteAvatarUseCase } from './delete-avatar.use-case'

describe('DeleteAvatarUseCase', () => {
	let useCase: DeleteAvatarUseCase
	let mockUserRepository: IUserRepository
	let mockStorageService: IStorageService

	beforeEach(() => {
		mockUserRepository = {
			findById: mock((id: string) =>
				Promise.resolve({
					id,
					name: 'Test User',
					email: 'test@example.com',
					avatarUrl: 'https://storage.example.com/bucket/avatars/user-123/avatar.webp',
				}),
			),
			update: mock(() => Promise.resolve()),
		} as any

		mockStorageService = {
			delete: mock(() => Promise.resolve()),
		} as any

		useCase = new DeleteAvatarUseCase(mockUserRepository, mockStorageService)
	})

	describe('Casos de Sucesso', () => {
		test('deve deletar avatar com sucesso', async () => {
			await useCase.execute({
				userId: 'user-123',
			})

			expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123')
			expect(mockStorageService.delete).toHaveBeenCalledWith('avatars/user-123/avatar.webp')
			expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', {
				avatarUrl: null,
			})
		})

		test('deve extrair key corretamente de URL S3', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: 'user-456',
				email: 'test@example.com',
				avatarUrl: 'https://my-bucket.s3.amazonaws.com/bucket/avatars/user-456/photo.webp',
			})

			await useCase.execute({
				userId: 'user-456',
			})

			expect(mockStorageService.delete).toHaveBeenCalledWith('avatars/user-456/photo.webp')
		})

		test('deve deletar avatar de diferentes formatos', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: 'user-789',
				email: 'test@example.com',
				avatarUrl: 'https://storage.example.com/bucket/avatars/user-789/1234567890.webp',
			})

			await useCase.execute({
				userId: 'user-789',
			})

			expect(mockStorageService.delete).toHaveBeenCalledWith('avatars/user-789/1234567890.webp')
		})

		test('deve retornar sem erro quando usuário não tem avatar', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: 'user-123',
				email: 'test@example.com',
				avatarUrl: null,
			})

			await useCase.execute({
				userId: 'user-123',
			})

			expect(mockStorageService.delete).not.toHaveBeenCalled()
			expect(mockUserRepository.update).not.toHaveBeenCalled()
		})

		test('deve retornar sem erro quando avatarUrl está vazio', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: 'user-123',
				email: 'test@example.com',
				avatarUrl: '',
			})

			await useCase.execute({
				userId: 'user-123',
			})

			expect(mockStorageService.delete).not.toHaveBeenCalled()
			expect(mockUserRepository.update).not.toHaveBeenCalled()
		})

		test('deve continuar e atualizar usuário mesmo se falhar ao deletar do storage', async () => {
			;(mockStorageService.delete as any).mockRejectedValueOnce(new Error('Storage delete failed'))

			await useCase.execute({
				userId: 'user-123',
			})

			// Deve ter tentado deletar
			expect(mockStorageService.delete).toHaveBeenCalled()

			// Deve ter atualizado o usuário mesmo assim
			expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', {
				avatarUrl: null,
			})
		})

		test('deve continuar se extractKeyFromUrl retornar null', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: 'user-123',
				email: 'test@example.com',
				avatarUrl: 'invalid-url',
			})

			await useCase.execute({
				userId: 'user-123',
			})

			// Delete não deve ser chamado se key é null
			expect(mockStorageService.delete).not.toHaveBeenCalled()

			// Mas deve atualizar o usuário
			expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', {
				avatarUrl: null,
			})
		})
	})

	describe('Validações de Usuário', () => {
		test('deve rejeitar quando usuário não existe', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce(null)

			await expect(
				useCase.execute({
					userId: 'user-999',
				}),
			).rejects.toThrow('Usuário não encontrado.')

			expect(mockStorageService.delete).not.toHaveBeenCalled()
			expect(mockUserRepository.update).not.toHaveBeenCalled()
		})

		test('deve lançar BadRequestError quando usuário não existe', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce(null)

			await expect(
				useCase.execute({
					userId: 'user-999',
				}),
			).rejects.toThrow(BadRequestError)
		})
	})

	describe('Integração com Serviços', () => {
		test('deve chamar serviços na ordem correta', async () => {
			const callOrder: string[] = []
			;(mockUserRepository.findById as any).mockImplementation(async () => {
				callOrder.push('findById')
				return {
					id: 'user-123',
					email: 'test@example.com',
					avatarUrl: 'https://storage.example.com/bucket/avatars/user-123/avatar.webp',
				}
			})
			;(mockStorageService.delete as any).mockImplementation(async () => {
				callOrder.push('delete')
			})
			;(mockUserRepository.update as any).mockImplementation(async () => {
				callOrder.push('update')
			})

			await useCase.execute({
				userId: 'user-123',
			})

			expect(callOrder).toEqual(['findById', 'delete', 'update'])
		})

		test('deve chamar delete apenas uma vez', async () => {
			await useCase.execute({
				userId: 'user-123',
			})

			expect(mockStorageService.delete).toHaveBeenCalledTimes(1)
		})

		test('deve chamar update apenas uma vez', async () => {
			await useCase.execute({
				userId: 'user-123',
			})

			expect(mockUserRepository.update).toHaveBeenCalledTimes(1)
		})
	})

	describe('Casos Edge', () => {
		test('deve lidar com URL complexa', async () => {
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: 'user-123',
				email: 'test@example.com',
				avatarUrl:
					'https://my-bucket.s3.us-east-1.amazonaws.com/production/avatars/user-123/profile-photo-1234567890.webp',
			})

			await useCase.execute({
				userId: 'user-123',
			})

			expect(mockStorageService.delete).toHaveBeenCalledWith(
				'avatars/user-123/profile-photo-1234567890.webp',
			)
		})

		test('deve lidar com userId com caracteres especiais', async () => {
			const specialUserId = 'user-abc-123-xyz'
			;(mockUserRepository.findById as any).mockResolvedValueOnce({
				id: specialUserId,
				email: 'test@example.com',
				avatarUrl: `https://storage.example.com/bucket/avatars/${specialUserId}/avatar.webp`,
			})

			await useCase.execute({
				userId: specialUserId,
			})

			expect(mockUserRepository.findById).toHaveBeenCalledWith(specialUserId)
			expect(mockStorageService.delete).toHaveBeenCalled()
			expect(mockUserRepository.update).toHaveBeenCalledWith(specialUserId, {
				avatarUrl: null,
			})
		})

		test('deve propagar erro do repository.update', async () => {
			;(mockUserRepository.update as any).mockRejectedValueOnce(new Error('Database error'))

			await expect(
				useCase.execute({
					userId: 'user-123',
				}),
			).rejects.toThrow('Database error')
		})

		test('deve propagar erro do repository.findById', async () => {
			;(mockUserRepository.findById as any).mockRejectedValueOnce(
				new Error('Database connection failed'),
			)

			await expect(
				useCase.execute({
					userId: 'user-123',
				}),
			).rejects.toThrow('Database connection failed')
		})
	})
})
