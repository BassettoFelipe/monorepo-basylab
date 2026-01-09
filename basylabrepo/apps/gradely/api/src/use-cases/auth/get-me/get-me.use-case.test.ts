import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { GetMeUseCase } from './get-me.use-case'

describe('GetMeUseCase', () => {
	let useCase: GetMeUseCase
	let mockUserRepository: IUserRepository

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		password: '$2b$12$hashedpassword',
		role: 'student' as const,
		phone: '+5511999999999',
		avatarUrl: 'https://example.com/avatar.jpg',
		isActive: true,
		isEmailVerified: true,
		verificationSecret: null,
		verificationExpiresAt: null,
		verificationAttempts: 0,
		verificationLastAttemptAt: null,
		verificationResendCount: 0,
		verificationLastResendAt: null,
		passwordResetSecret: null,
		passwordResetExpiresAt: null,
		passwordResetAttempts: 0,
		passwordResetLastAttemptAt: null,
		passwordResetResendCount: 0,
		passwordResetCooldownEndsAt: null,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-02'),
	}

	const mockUserProfile = {
		id: mockUser.id,
		email: mockUser.email,
		name: mockUser.name,
		role: mockUser.role,
		phone: mockUser.phone,
		avatarUrl: mockUser.avatarUrl,
		isEmailVerified: mockUser.isEmailVerified,
		createdAt: mockUser.createdAt,
	}

	beforeEach(() => {
		mockUserRepository = {
			findById: mock(() => Promise.resolve(mockUser)),
			findByEmail: mock(() => Promise.resolve(null)),
			findByEmailForAuth: mock(() => Promise.resolve(null)),
			findByIdForProfile: mock(() => Promise.resolve(mockUserProfile)),
			findByIdForRefresh: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve(mockUser)),
			update: mock(() => Promise.resolve(mockUser)),
			delete: mock(() => Promise.resolve(true)),
			findByRole: mock(() => Promise.resolve([])),
		}

		useCase = new GetMeUseCase(mockUserRepository)
	})

	describe('User Lookup', () => {
		test('should throw UserNotFoundError when user does not exist', async () => {
			mockUserRepository.findByIdForProfile = mock(() => Promise.resolve(null))

			await expect(useCase.execute({ userId: 'non-existent' })).rejects.toThrow(
				'Usuário não encontrado',
			)
		})

		test('should find user by id', async () => {
			await useCase.execute({ userId: 'user-123' })

			expect(mockUserRepository.findByIdForProfile).toHaveBeenCalledWith('user-123')
		})
	})

	describe('Return Values', () => {
		test('should return correct user data', async () => {
			const result = await useCase.execute({ userId: 'user-123' })

			expect(result).toEqual({
				id: mockUser.id,
				email: mockUser.email,
				name: mockUser.name,
				role: mockUser.role,
				phone: mockUser.phone,
				avatarUrl: mockUser.avatarUrl,
				isEmailVerified: mockUser.isEmailVerified,
				createdAt: mockUser.createdAt,
			})
		})

		test('should handle null phone and avatarUrl', async () => {
			const userWithNulls = { ...mockUserProfile, phone: null, avatarUrl: null }
			mockUserRepository.findByIdForProfile = mock(() => Promise.resolve(userWithNulls))

			const result = await useCase.execute({ userId: 'user-123' })

			expect(result.phone).toBeNull()
			expect(result.avatarUrl).toBeNull()
		})
	})
})
