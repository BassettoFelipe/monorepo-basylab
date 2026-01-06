import { beforeEach, describe, expect, it } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { UnauthorizedError } from '@basylab/core/errors'
import { InMemoryUserRepository } from '@/test/in-memory-repositories'
import { createTestManager, createTestOwner } from '@/test/test-helpers'
import { GetCurrentUserUseCase } from '../get-current-user/get-current-user.use-case'
import { LoginUseCase } from '../login/login.use-case'

describe('Auth Use Cases', () => {
	let userRepository: InMemoryUserRepository

	beforeEach(() => {
		userRepository = new InMemoryUserRepository()
	})

	describe('LoginUseCase', () => {
		it('should login successfully with valid credentials', async () => {
			const passwordHash = await PasswordUtils.hash('password123')
			const user = await createTestOwner({
				email: 'test@example.com',
				passwordHash,
				name: 'Test User',
			})
			userRepository.seed([user])

			const useCase = new LoginUseCase(userRepository)

			const result = await useCase.execute({
				email: 'test@example.com',
				password: 'password123',
			})

			expect(result.accessToken).toBeDefined()
			expect(result.refreshToken).toBeDefined()
			expect(result.user.email).toBe('test@example.com')
			expect(result.user.name).toBe('Test User')
		})

		it('should normalize email to lowercase', async () => {
			const passwordHash = await PasswordUtils.hash('password123')
			const user = await createTestOwner({
				email: 'test@example.com',
				passwordHash,
			})
			userRepository.seed([user])

			const useCase = new LoginUseCase(userRepository)

			const result = await useCase.execute({
				email: 'TEST@EXAMPLE.COM',
				password: 'password123',
			})

			expect(result.user.email).toBe('test@example.com')
		})

		it('should throw UnauthorizedError when user does not exist', async () => {
			const useCase = new LoginUseCase(userRepository)

			await expect(
				useCase.execute({
					email: 'nonexistent@example.com',
					password: 'password123',
				}),
			).rejects.toThrow(UnauthorizedError)
		})

		it('should throw UnauthorizedError when password is incorrect', async () => {
			const passwordHash = await PasswordUtils.hash('password123')
			const user = await createTestOwner({
				email: 'test@example.com',
				passwordHash,
			})
			userRepository.seed([user])

			const useCase = new LoginUseCase(userRepository)

			await expect(
				useCase.execute({
					email: 'test@example.com',
					password: 'wrongpassword',
				}),
			).rejects.toThrow(UnauthorizedError)
		})

		it('should throw UnauthorizedError when user is inactive', async () => {
			const passwordHash = await PasswordUtils.hash('password123')
			const user = await createTestOwner({
				email: 'test@example.com',
				passwordHash,
				isActive: false,
			})
			userRepository.seed([user])

			const useCase = new LoginUseCase(userRepository)

			await expect(
				useCase.execute({
					email: 'test@example.com',
					password: 'password123',
				}),
			).rejects.toThrow(UnauthorizedError)
		})

		it('should return correct role for manager', async () => {
			const passwordHash = await PasswordUtils.hash('password123')
			const manager = await createTestManager({
				email: 'manager@example.com',
				passwordHash,
			})
			userRepository.seed([manager])

			const useCase = new LoginUseCase(userRepository)

			const result = await useCase.execute({
				email: 'manager@example.com',
				password: 'password123',
			})

			expect(result.user.role).toBe('manager')
		})
	})

	describe('GetCurrentUserUseCase', () => {
		it('should get current user by id', async () => {
			const user = await createTestOwner({
				name: 'Test User',
				email: 'test@example.com',
			})
			userRepository.seed([user])

			const useCase = new GetCurrentUserUseCase(userRepository)

			const result = await useCase.execute({
				userId: user.id,
			})

			expect(result.id).toBe(user.id)
			expect(result.email).toBe('test@example.com')
			expect(result.name).toBe('Test User')
		})

		it('should throw UnauthorizedError when user does not exist', async () => {
			const useCase = new GetCurrentUserUseCase(userRepository)

			await expect(
				useCase.execute({
					userId: 'non-existent-id',
				}),
			).rejects.toThrow(UnauthorizedError)
		})

		it('should return user role', async () => {
			const manager = await createTestManager({
				email: 'manager@example.com',
			})
			userRepository.seed([manager])

			const useCase = new GetCurrentUserUseCase(userRepository)

			const result = await useCase.execute({
				userId: manager.id,
			})

			expect(result.role).toBe('manager')
		})
	})
})
