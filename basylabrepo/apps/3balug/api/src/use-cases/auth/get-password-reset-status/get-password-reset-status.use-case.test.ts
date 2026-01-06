import { afterAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import {
	EmailNotVerifiedError,
	EmailSendFailedError,
	UserNotFoundError,
} from '@basylab/core/errors'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import * as emailServiceModule from '@/services/email'
import { EmailServiceError } from '@/services/email'
import type { User } from '@/types/user'
import { TotpUtils } from '@/utils/totp.utils'
import { GetPasswordResetStatusUseCase } from './get-password-reset-status.use-case'

// Create mock email service
const mockSendPasswordResetCode = mock(() => Promise.resolve())
const mockVerifyConnection = mock(() => Promise.resolve(true))

const mockEmailService = {
	sendVerificationCode: mock(() => Promise.resolve()),
	sendPasswordResetCode: mockSendPasswordResetCode,
	verifyConnection: mockVerifyConnection,
}

// Use spyOn on getEmailServiceInstance instead of directly on the proxy
const mockGetEmailServiceInstance = spyOn(
	emailServiceModule,
	'getEmailServiceInstance',
).mockReturnValue(mockEmailService as any)

// Use spyOn instead of mock.module to avoid global module pollution
const mockGenerateSecret = spyOn(TotpUtils, 'generateSecret').mockReturnValue('TOTP_SECRET_123')
const mockGenerateCode = spyOn(TotpUtils, 'generateCode').mockResolvedValue('123456')

// Restore original implementations after all tests
afterAll(() => {
	mockGetEmailServiceInstance.mockRestore()
	mockGenerateSecret.mockRestore()
	mockGenerateCode.mockRestore()
})

describe('GetPasswordResetStatusUseCase', () => {
	let userRepository: IUserRepository
	let getPasswordResetStatusUseCase: GetPasswordResetStatusUseCase

	const baseUser: User = {
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
		passwordResetAttempts: 0,
		passwordResetLastAttemptAt: null,
		passwordResetResendCount: 0,
		passwordResetCooldownEndsAt: null,
		passwordResetResendBlocked: false,
		passwordResetResendBlockedUntil: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	}

	beforeEach(() => {
		mockGenerateSecret.mockClear()
		mockGenerateCode.mockClear()
		mockSendPasswordResetCode.mockClear()

		mockGenerateSecret.mockReturnValue('TOTP_SECRET_123')
		mockGenerateCode.mockResolvedValue('123456')
		mockSendPasswordResetCode.mockImplementation(() => Promise.resolve())

		userRepository = {
			findByEmail: mock(() => Promise.resolve({ ...baseUser })),
			update: mock(() => Promise.resolve()),
		} as unknown as IUserRepository

		getPasswordResetStatusUseCase = new GetPasswordResetStatusUseCase(userRepository)
	})

	describe('Primeiro acesso (sem código ativo)', () => {
		it('deve enviar email e retornar status inicial', async () => {
			const result = await getPasswordResetStatusUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.canResend).toBe(true)
			expect(result.remainingResendAttempts).toBe(5)
			expect(result.canResendAt).toBeNull()
			expect(result.remainingCodeAttempts).toBe(5)
			expect(result.canTryCodeAt).toBeNull()
			expect(result.isResendBlocked).toBe(false)
			expect(result.resendBlockedUntil).toBeNull()
			expect(result.codeExpiresAt).toBeTruthy()

			expect(mockGenerateSecret).toHaveBeenCalled()
			expect(mockGenerateCode).toHaveBeenCalledWith('TOTP_SECRET_123')
			expect(mockSendPasswordResetCode).toHaveBeenCalledWith(
				'test@example.com',
				'Test User',
				'123456',
			)

			expect(userRepository.update).toHaveBeenCalledWith('user-id-123', {
				passwordResetSecret: 'TOTP_SECRET_123',
				passwordResetExpiresAt: expect.any(Date),
				passwordResetResendCount: 0,
				passwordResetCooldownEndsAt: null,
				passwordResetAttempts: 0,
				passwordResetLastAttemptAt: null,
				passwordResetResendBlocked: false,
				passwordResetResendBlockedUntil: null,
			})
		})

		it('deve normalizar email (lowercase e trim)', async () => {
			await getPasswordResetStatusUseCase.execute({
				email: '  TEST@EXAMPLE.COM  ',
			})

			expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
		})

		it('deve permitir reset para usuário criado por admin (sem senha)', async () => {
			const adminCreatedUser = {
				...baseUser,
				password: null,
				isEmailVerified: false,
			}

			userRepository.findByEmail = mock(() => Promise.resolve(adminCreatedUser))

			const result = await getPasswordResetStatusUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.canResend).toBe(true)
			expect(mockSendPasswordResetCode).toHaveBeenCalled()
		})

		it('deve lançar erro se falhar ao enviar email', async () => {
			mockSendPasswordResetCode.mockImplementation(() => {
				throw new EmailServiceError('SMTP error', new Error('SMTP connection failed'))
			})

			await expect(
				getPasswordResetStatusUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(EmailSendFailedError)

			await expect(
				getPasswordResetStatusUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(
				'Não foi possível enviar o email de recuperação de senha. Tente novamente mais tarde.',
			)
		})
	})

	describe('Com código ativo', () => {
		it('deve retornar status sem enviar novo email', async () => {
			const userWithActiveCode = {
				...baseUser,
				passwordResetSecret: 'EXISTING_SECRET',
				passwordResetExpiresAt: new Date(Date.now() + 300000), // 5 minutes from now
				passwordResetResendCount: 1,
				passwordResetAttempts: 0,
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userWithActiveCode))

			const result = await getPasswordResetStatusUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.canResend).toBe(true)
			expect(result.remainingResendAttempts).toBe(4) // 5 - 1
			expect(result.remainingCodeAttempts).toBe(5)
			expect(result.codeExpiresAt).toBeTruthy()

			expect(mockSendPasswordResetCode).not.toHaveBeenCalled()
			expect(userRepository.update).not.toHaveBeenCalled()
		})

		it('deve calcular cooldown de resend corretamente', async () => {
			const userWithCooldown = {
				...baseUser,
				passwordResetSecret: 'EXISTING_SECRET',
				passwordResetExpiresAt: new Date(Date.now() + 300000),
				passwordResetCooldownEndsAt: new Date(Date.now() + 30000), // 30s from now
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userWithCooldown))

			const result = await getPasswordResetStatusUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.canResend).toBe(false)
			expect(result.canResendAt).toBeTruthy()
			const canResendDate = new Date(result.canResendAt!)
			expect(canResendDate.getTime()).toBeGreaterThan(Date.now())
			expect(canResendDate.getTime()).toBeLessThanOrEqual(Date.now() + 31000)
		})

		it('deve calcular throttle de código corretamente', async () => {
			const userWithThrottle = {
				...baseUser,
				passwordResetSecret: 'EXISTING_SECRET',
				passwordResetExpiresAt: new Date(Date.now() + 300000),
				passwordResetAttempts: 3, // 4ª tentativa terá delay de 15s
				passwordResetLastAttemptAt: new Date(Date.now() - 5000), // 5s ago
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userWithThrottle))

			const result = await getPasswordResetStatusUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.canTryCodeAt).toBeTruthy()
			const canTryCodeDate = new Date(result.canTryCodeAt!)
			expect(canTryCodeDate.getTime()).toBeGreaterThan(Date.now())
			expect(canTryCodeDate.getTime()).toBeLessThanOrEqual(Date.now() + 16000)
			expect(result.remainingCodeAttempts).toBe(2) // 5 - 3
		})

		it('deve retornar 0 tentativas restantes quando bloqueado', async () => {
			const userBlocked = {
				...baseUser,
				passwordResetSecret: 'EXISTING_SECRET',
				passwordResetExpiresAt: new Date(Date.now() + 300000),
				passwordResetResendBlocked: true,
				passwordResetResendBlockedUntil: new Date(Date.now() + 3600000), // 1h from now
				passwordResetResendCount: 5,
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userBlocked))

			const result = await getPasswordResetStatusUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.canResend).toBe(false)
			expect(result.isResendBlocked).toBe(true)
			expect(result.remainingResendAttempts).toBe(0)
			expect(result.resendBlockedUntil).toBeTruthy()
		})

		it('deve resetar bloqueio se período expirou', async () => {
			const userWithExpiredBlock = {
				...baseUser,
				passwordResetSecret: 'EXISTING_SECRET',
				passwordResetExpiresAt: new Date(Date.now() + 300000),
				passwordResetResendBlocked: true,
				passwordResetResendBlockedUntil: new Date(Date.now() - 1000), // 1s ago (expired)
				passwordResetResendCount: 5,
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userWithExpiredBlock))

			await getPasswordResetStatusUseCase.execute({
				email: 'test@example.com',
			})

			expect(userRepository.update).toHaveBeenCalledWith('user-id-123', {
				passwordResetResendBlocked: false,
				passwordResetResendBlockedUntil: null,
				passwordResetResendCount: 0,
			})
		})
	})

	describe('Validações de usuário', () => {
		it('deve lançar erro se usuário não existir', async () => {
			userRepository.findByEmail = mock(() => Promise.resolve(null))

			await expect(
				getPasswordResetStatusUseCase.execute({
					email: 'nonexistent@example.com',
				}),
			).rejects.toThrow(UserNotFoundError)

			await expect(
				getPasswordResetStatusUseCase.execute({
					email: 'nonexistent@example.com',
				}),
			).rejects.toThrow('Usuário não encontrado.')
		})

		it('deve lançar erro se email não verificado (usuário normal com senha)', async () => {
			const unverifiedUser = {
				...baseUser,
				password: '$2b$10$hashedPassword',
				isEmailVerified: false,
			}

			userRepository.findByEmail = mock(() => Promise.resolve(unverifiedUser))

			await expect(
				getPasswordResetStatusUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(EmailNotVerifiedError)

			await expect(
				getPasswordResetStatusUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow('Email não verificado. Por favor, verifique seu email primeiro.')
		})
	})
})
