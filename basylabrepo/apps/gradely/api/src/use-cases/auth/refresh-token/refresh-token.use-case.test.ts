import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { RefreshTokenUseCase } from './refresh-token.use-case'

describe('RefreshTokenUseCase', () => {
	let useCase: RefreshTokenUseCase
	let mockUserRepository: IUserRepository

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		password: '$2b$12$hashedpassword',
		role: 'student' as const,
		phone: null,
		avatarUrl: null,
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
		createdAt: new Date(),
		updatedAt: new Date(),
	}

	const mockRefreshUser = {
		id: mockUser.id,
		role: mockUser.role,
		isActive: mockUser.isActive,
	}

	beforeEach(() => {
		mockUserRepository = {
			findById: mock(() => Promise.resolve(mockUser)),
			findByEmail: mock(() => Promise.resolve(null)),
			findByEmailForAuth: mock(() => Promise.resolve(null)),
			findByIdForProfile: mock(() => Promise.resolve(null)),
			findByIdForRefresh: mock(() => Promise.resolve(mockRefreshUser)),
			create: mock(() => Promise.resolve(mockUser)),
			update: mock(() => Promise.resolve(mockUser)),
			delete: mock(() => Promise.resolve(true)),
			findByRole: mock(() => Promise.resolve([])),
		}

		useCase = new RefreshTokenUseCase(mockUserRepository)
	})

	describe('User Validation', () => {
		test('should throw UserNotFoundError when user does not exist', async () => {
			mockUserRepository.findByIdForRefresh = mock(() => Promise.resolve(null))

			// Mock JwtUtils inline para este teste específico
			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken
			JwtUtils.verifyToken = mock(() =>
				Promise.resolve({
					sub: 'user-123',
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
				}),
			)

			try {
				await expect(useCase.execute({ refreshToken: 'valid-token' })).rejects.toThrow(
					'Usuário não encontrado',
				)
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})

		test('should throw AccountDeactivatedError when user is not active', async () => {
			const inactiveUser = { ...mockRefreshUser, isActive: false }
			mockUserRepository.findByIdForRefresh = mock(() => Promise.resolve(inactiveUser))

			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken
			JwtUtils.verifyToken = mock(() =>
				Promise.resolve({
					sub: 'user-123',
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
				}),
			)

			try {
				await expect(useCase.execute({ refreshToken: 'valid-token' })).rejects.toThrow(
					'Sua conta foi desativada. Entre em contato com o administrador da sua empresa para mais informações.',
				)
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})
	})

	describe('Token Validation', () => {
		test('should throw InvalidTokenError when token is invalid', async () => {
			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken
			JwtUtils.verifyToken = mock(() => Promise.resolve(null))

			try {
				await expect(useCase.execute({ refreshToken: 'invalid-token' })).rejects.toThrow(
					'Token de atualização inválido ou expirado',
				)
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})
	})

	describe('Return Values', () => {
		test('should return new tokens on success', async () => {
			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken
			JwtUtils.verifyToken = mock(() =>
				Promise.resolve({
					sub: 'user-123',
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
				}),
			)

			try {
				const result = await useCase.execute({ refreshToken: 'valid-token' })

				expect(result.accessToken).toBeDefined()
				expect(result.refreshToken).toBeDefined()
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})
	})
})
