import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { EmailNotVerifiedError, UserNotFoundError } from '@basylab/core/errors'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { User } from '@/types/user'
import { ValidateEmailForResetUseCase } from './validate-email-for-reset.use-case'

describe('ValidateEmailForResetUseCase', () => {
	let userRepository: IUserRepository
	let validateEmailForResetUseCase: ValidateEmailForResetUseCase

	const mockUser: User = {
		id: 'user-id-123',
		name: 'Test User',
		email: 'test@example.com',
		password: '$2b$10$hashedPassword',
		role: 'member',
		phone: null,
		avatarUrl: null,
		companyId: 'company-123',
		createdBy: null,
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
		passwordResetResendCount: 0,
		passwordResetCooldownEndsAt: null,
		passwordResetResendBlocked: false,
		passwordResetResendBlockedUntil: null,
		passwordResetAttempts: 0,
		passwordResetLastAttemptAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	}

	beforeEach(() => {
		userRepository = {
			findByEmail: mock(() => Promise.resolve({ ...mockUser })),
		} as unknown as IUserRepository

		validateEmailForResetUseCase = new ValidateEmailForResetUseCase(userRepository)
	})

	describe('Fluxo de sucesso', () => {
		it('deve retornar dados do usuário para email válido e verificado', async () => {
			const result = await validateEmailForResetUseCase.execute({
				email: 'test@example.com',
			})

			expect(result).toEqual({
				email: 'test@example.com',
				name: 'Test User',
			})

			expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
		})

		it('deve normalizar email (lowercase e trim)', async () => {
			await validateEmailForResetUseCase.execute({
				email: '  TEST@EXAMPLE.COM  ',
			})

			expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
		})

		it('deve permitir reset para usuário criado por admin (sem senha)', async () => {
			const adminCreatedUser = {
				...mockUser,
				password: null, // Usuário criado por admin
				isEmailVerified: false, // Ainda não verificou email
			}

			userRepository.findByEmail = mock(() => Promise.resolve(adminCreatedUser))

			const result = await validateEmailForResetUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.email).toBe('test@example.com')
			expect(result.name).toBe('Test User')
		})
	})

	describe('Validações de erro', () => {
		it('deve lançar erro se usuário não existir', async () => {
			userRepository.findByEmail = mock(() => Promise.resolve(null))

			await expect(
				validateEmailForResetUseCase.execute({
					email: 'nonexistent@example.com',
				}),
			).rejects.toThrow(UserNotFoundError)

			await expect(
				validateEmailForResetUseCase.execute({
					email: 'nonexistent@example.com',
				}),
			).rejects.toThrow('Email não encontrado. Verifique o email informado.')
		})

		it('deve lançar erro se email não verificado (usuário normal com senha)', async () => {
			const unverifiedUser = {
				...mockUser,
				password: '$2b$10$hashedPassword', // Tem senha
				isEmailVerified: false, // Email não verificado
			}

			userRepository.findByEmail = mock(() => Promise.resolve(unverifiedUser))

			await expect(
				validateEmailForResetUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(EmailNotVerifiedError)

			await expect(
				validateEmailForResetUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow('Email não verificado. Por favor, verifique seu email primeiro.')
		})
	})

	describe('Casos especiais', () => {
		it('deve aceitar emails com diferentes formatos', async () => {
			const testEmails = [
				'user@example.com',
				'user.name@example.com',
				'user+tag@example.com',
				'user123@subdomain.example.com',
			]

			for (const email of testEmails) {
				const userWithEmail = { ...mockUser, email }
				userRepository.findByEmail = mock(() => Promise.resolve(userWithEmail))

				const result = await validateEmailForResetUseCase.execute({ email })

				expect(result.email).toBe(email)
			}
		})

		it('deve preservar nome do usuário na resposta', async () => {
			const userWithDifferentName = {
				...mockUser,
				name: 'João da Silva Santos',
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userWithDifferentName))

			const result = await validateEmailForResetUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.name).toBe('João da Silva Santos')
		})
	})
})
