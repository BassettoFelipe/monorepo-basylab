import { afterAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import {
	EmailNotVerifiedError,
	EmailSendFailedError,
	TooManyAttemptsError,
	UserNotFoundError,
} from '@basylab/core/errors'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import * as emailServiceModule from '@/services/email'
import { EmailServiceError } from '@/services/email'
import type { User } from '@/types/user'
import { TotpUtils } from '@/utils/totp.utils'
import { ResendPasswordResetCodeUseCase } from './resend-password-reset-code.use-case'

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
const mockGenerateSecret = spyOn(TotpUtils, 'generateSecret').mockReturnValue('TOTP_SECRET_NEW')
const mockGenerateCode = spyOn(TotpUtils, 'generateCode').mockResolvedValue('654321')

// Restore original implementations after all tests
afterAll(() => {
	mockGetEmailServiceInstance.mockRestore()
	mockGenerateSecret.mockRestore()
	mockGenerateCode.mockRestore()
})

describe('ResendPasswordResetCodeUseCase', () => {
	let userRepository: IUserRepository
	let resendPasswordResetCodeUseCase: ResendPasswordResetCodeUseCase

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
		passwordResetSecret: 'OLD_SECRET',
		passwordResetExpiresAt: new Date(Date.now() + 300000),
		passwordResetResendCount: 1,
		passwordResetCooldownEndsAt: null,
		passwordResetResendBlocked: false,
		passwordResetResendBlockedUntil: null,
		passwordResetAttempts: 2,
		passwordResetLastAttemptAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	}

	beforeEach(() => {
		mockGenerateSecret.mockClear()
		mockGenerateCode.mockClear()
		mockSendPasswordResetCode.mockClear()

		mockGenerateSecret.mockReturnValue('TOTP_SECRET_NEW')
		mockGenerateCode.mockResolvedValue('654321')
		mockSendPasswordResetCode.mockImplementation(() => Promise.resolve())

		userRepository = {
			findByEmail: mock(() => Promise.resolve({ ...baseUser })),
			update: mock(() => Promise.resolve()),
		} as unknown as IUserRepository

		resendPasswordResetCodeUseCase = new ResendPasswordResetCodeUseCase(userRepository)
	})

	describe('Fluxo de sucesso', () => {
		it('deve reenviar código com sucesso', async () => {
			const result = await resendPasswordResetCodeUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.remainingResendAttempts).toBe(3) // 5 - 2 (1 anterior + 1 atual)
			expect(result.canResendAt).toBeTruthy()
			const canResendDate = new Date(result.canResendAt)
			expect(canResendDate.getTime()).toBeGreaterThan(Date.now())
			expect(result.codeExpiresAt).toBeTruthy()

			expect(mockGenerateSecret).toHaveBeenCalled()
			expect(mockGenerateCode).toHaveBeenCalledWith('TOTP_SECRET_NEW')
			expect(mockSendPasswordResetCode).toHaveBeenCalledWith(
				'test@example.com',
				'Test User',
				'654321',
			)

			expect(userRepository.update).toHaveBeenCalledWith('user-id-123', {
				passwordResetSecret: 'TOTP_SECRET_NEW',
				passwordResetExpiresAt: expect.any(Date),
				passwordResetResendCount: 2, // 1 + 1
				passwordResetCooldownEndsAt: expect.any(Date),
				passwordResetAttempts: 0, // Reset code attempts
			})
		})

		it('deve normalizar email (lowercase e trim)', async () => {
			await resendPasswordResetCodeUseCase.execute({
				email: '  TEST@EXAMPLE.COM  ',
			})

			expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
		})

		it('deve resetar tentativas de código ao reenviar', async () => {
			const userWith4Attempts = {
				...baseUser,
				passwordResetAttempts: 4, // Vai resetar para 0
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userWith4Attempts))

			await resendPasswordResetCodeUseCase.execute({
				email: 'test@example.com',
			})

			expect(userRepository.update).toHaveBeenCalledWith(
				'user-id-123',
				expect.objectContaining({
					passwordResetAttempts: 0,
				}),
			)
		})

		it('deve permitir resend para usuário criado por admin (sem senha)', async () => {
			const adminCreatedUser = {
				...baseUser,
				password: null,
				isEmailVerified: false,
			}

			userRepository.findByEmail = mock(() => Promise.resolve(adminCreatedUser))

			const result = await resendPasswordResetCodeUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.remainingResendAttempts).toBeGreaterThanOrEqual(0)
			expect(mockSendPasswordResetCode).toHaveBeenCalled()
		})
	})

	describe('Validações de limite', () => {
		it('deve lançar erro ao atingir limite de reenvios', async () => {
			const userAtLimit = {
				...baseUser,
				passwordResetResendCount: 5, // MAX_RESEND_ATTEMPTS
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userAtLimit))

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(TooManyAttemptsError)

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(/Limite de reenvios atingido\. Aguarde 30 minutos para tentar novamente\./)

			expect(userRepository.update).toHaveBeenCalledWith('user-id-123', {
				passwordResetResendBlocked: true,
				passwordResetResendBlockedUntil: expect.any(Date),
			})
		})

		it('deve lançar erro se resend bloqueado', async () => {
			const userBlocked = {
				...baseUser,
				passwordResetResendBlocked: true,
				passwordResetResendBlockedUntil: new Date(Date.now() + 1800000), // 30 min from now
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userBlocked))

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(TooManyAttemptsError)

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(
				/Muitas tentativas de reenvio\. Aguarde \d+ minuto\(s\) para tentar novamente\./,
			)
		})

		it('deve lançar erro se em cooldown', async () => {
			const userInCooldown = {
				...baseUser,
				passwordResetCooldownEndsAt: new Date(Date.now() + 30000), // 30s from now
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userInCooldown))

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(TooManyAttemptsError)

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(/Aguarde \d+ segundos antes de solicitar um novo código\./)
		})

		it('deve permitir resend após cooldown expirar', async () => {
			const userAfterCooldown = {
				...baseUser,
				passwordResetCooldownEndsAt: new Date(Date.now() - 1000), // 1s ago (expired)
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userAfterCooldown))

			const result = await resendPasswordResetCodeUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.remainingResendAttempts).toBeGreaterThanOrEqual(0)
			expect(mockSendPasswordResetCode).toHaveBeenCalled()
		})

		it('deve permitir resend após bloqueio expirar', async () => {
			const userAfterBlock = {
				...baseUser,
				passwordResetResendBlocked: true,
				passwordResetResendBlockedUntil: new Date(Date.now() - 1000), // 1s ago (expired)
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userAfterBlock))

			const result = await resendPasswordResetCodeUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.remainingResendAttempts).toBeGreaterThanOrEqual(0)
			expect(mockSendPasswordResetCode).toHaveBeenCalled()
		})
	})

	describe('Validações de usuário', () => {
		it('deve lançar erro se usuário não existir', async () => {
			userRepository.findByEmail = mock(() => Promise.resolve(null))

			await expect(
				resendPasswordResetCodeUseCase.execute({
					email: 'nonexistent@example.com',
				}),
			).rejects.toThrow(UserNotFoundError)

			await expect(
				resendPasswordResetCodeUseCase.execute({
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
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(EmailNotVerifiedError)

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow('Email não verificado. Por favor, verifique seu email primeiro.')
		})
	})

	describe('Envio de email', () => {
		it('deve lançar erro se falhar ao enviar email', async () => {
			mockSendPasswordResetCode.mockImplementation(() => {
				throw new EmailServiceError('SMTP error', new Error('SMTP connection failed'))
			})

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(EmailSendFailedError)

			await expect(
				resendPasswordResetCodeUseCase.execute({ email: 'test@example.com' }),
			).rejects.toThrow(
				'Não foi possível enviar o email de recuperação de senha. Tente novamente mais tarde.',
			)
		})
	})

	describe('Contadores e cooldowns', () => {
		it('deve incrementar contador de reenvios', async () => {
			const userWith2Resends = {
				...baseUser,
				passwordResetResendCount: 2,
			}

			userRepository.findByEmail = mock(() => Promise.resolve(userWith2Resends))

			const result = await resendPasswordResetCodeUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.remainingResendAttempts).toBe(2) // 5 - 3
			expect(userRepository.update).toHaveBeenCalledWith(
				'user-id-123',
				expect.objectContaining({
					passwordResetResendCount: 3,
				}),
			)
		})

		it('deve aplicar cooldown de 60 segundos', async () => {
			const result = await resendPasswordResetCodeUseCase.execute({
				email: 'test@example.com',
			})

			expect(result.canResendAt).toBeTruthy()
			const canResendDate = new Date(result.canResendAt)
			const expectedTime = Date.now() + 60000
			expect(canResendDate.getTime()).toBeGreaterThanOrEqual(expectedTime - 1000)
			expect(canResendDate.getTime()).toBeLessThanOrEqual(expectedTime + 1000)
		})
	})
})
