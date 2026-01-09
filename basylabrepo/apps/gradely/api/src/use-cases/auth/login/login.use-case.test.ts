import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { LoginUseCase } from './login.use-case'

describe('LoginUseCase', () => {
	let useCase: LoginUseCase
	let mockUserRepository: IUserRepository

	const validInput = {
		email: 'test@example.com',
		password: 'ValidPass123',
	}

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

	const mockAuthUser = {
		id: mockUser.id,
		email: mockUser.email,
		password: mockUser.password,
		name: mockUser.name,
		role: mockUser.role,
		isActive: mockUser.isActive,
	}

	beforeEach(() => {
		PasswordUtils.verify = mock(() => Promise.resolve(true))

		mockUserRepository = {
			findById: mock(() => Promise.resolve(null)),
			findByEmail: mock(() => Promise.resolve(mockUser)),
			findByEmailForAuth: mock(() => Promise.resolve(mockAuthUser)),
			findByIdForProfile: mock(() => Promise.resolve(null)),
			findByIdForRefresh: mock(() => Promise.resolve(null)),
			create: mock(() => Promise.resolve(mockUser)),
			update: mock(() => Promise.resolve(mockUser)),
			delete: mock(() => Promise.resolve(true)),
			findByRole: mock(() => Promise.resolve([])),
		}

		useCase = new LoginUseCase(mockUserRepository)
	})

	describe('User Validation', () => {
		test('should throw InvalidCredentialsError when user does not exist', async () => {
			mockUserRepository.findByEmailForAuth = mock(() => Promise.resolve(null))

			await expect(useCase.execute(validInput)).rejects.toThrow('Email ou senha incorretos')
		})

		test('should throw InvalidCredentialsError when user has no password', async () => {
			const userWithoutPassword = { ...mockAuthUser, password: null }
			mockUserRepository.findByEmailForAuth = mock(() => Promise.resolve(userWithoutPassword))

			await expect(useCase.execute(validInput)).rejects.toThrow('Email ou senha incorretos')
		})

		test('should normalize email to lowercase', async () => {
			await useCase.execute({ ...validInput, email: 'TEST@EXAMPLE.COM' })

			expect(mockUserRepository.findByEmailForAuth).toHaveBeenCalledWith('test@example.com')
		})
	})

	describe('Password Validation', () => {
		test('should throw InvalidCredentialsError when password is incorrect', async () => {
			PasswordUtils.verify = mock(() => Promise.resolve(false))

			await expect(useCase.execute(validInput)).rejects.toThrow('Email ou senha incorretos')
		})

		test('should verify password with PasswordUtils', async () => {
			await useCase.execute(validInput)

			expect(PasswordUtils.verify).toHaveBeenCalledWith(validInput.password, mockUser.password)
		})
	})

	describe('Account Status', () => {
		test('should throw AccountDeactivatedError when user is not active', async () => {
			const inactiveUser = { ...mockAuthUser, isActive: false }
			mockUserRepository.findByEmailForAuth = mock(() => Promise.resolve(inactiveUser))

			await expect(useCase.execute(validInput)).rejects.toThrow(
				'Sua conta foi desativada. Entre em contato com o administrador da sua empresa para mais informações.',
			)
		})
	})

	describe('Return Values', () => {
		test('should return correct user data', async () => {
			const result = await useCase.execute(validInput)

			expect(result.user).toEqual({
				id: mockUser.id,
				email: mockUser.email,
				name: mockUser.name,
				role: mockUser.role,
			})
		})

		test('should return tokens', async () => {
			const result = await useCase.execute(validInput)

			expect(result.accessToken).toBeDefined()
			expect(result.refreshToken).toBeDefined()
		})
	})
})
