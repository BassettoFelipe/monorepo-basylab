import {
	AccountAlreadyVerifiedError,
	EmailSendFailedError,
	ResendLimitExceededError,
	UserNotFoundError,
} from '@basylab/core/errors'
import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { EMAIL_VERIFICATION } from '@/constants/auth.constants'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { emailService } from '@/services/email/email.service'
import { TotpUtils } from '@/utils/totp.utils'

interface ResendVerificationCodeInput {
	email: string
}

interface ResendVerificationCodeOutput {
	success: boolean
	message: string
	remainingAttempts: number
	canResendAt: Date
	isBlocked: boolean
	blockedUntil: Date | null
}

export class ResendVerificationCodeUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: ResendVerificationCodeInput): Promise<ResendVerificationCodeOutput> {
		const normalizedEmail = input.email.toLowerCase().trim()
		const user = await this.userRepository.findByEmail(normalizedEmail)
		if (!user) {
			throw new UserNotFoundError()
		}

		if (user.isEmailVerified) {
			throw new AccountAlreadyVerifiedError()
		}

		const now = new Date()

		let resendCount = user.verificationResendCount || 0
		const lastResendAt = user.verificationLastResendAt

		if (lastResendAt) {
			const hoursSinceLastResend = (now.getTime() - lastResendAt.getTime()) / (1000 * 60 * 60)

			if (hoursSinceLastResend >= EMAIL_VERIFICATION.RESET_WINDOW_HOURS) {
				resendCount = 0
			}
		}

		if (resendCount >= EMAIL_VERIFICATION.MAX_RESEND_ATTEMPTS) {
			throw new ResendLimitExceededError(
				`Você atingiu o limite máximo de ${EMAIL_VERIFICATION.MAX_RESEND_ATTEMPTS} reenvios. Tente novamente em 24 horas ou entre em contato com o suporte.`,
			)
		}

		const currentCooldown =
			resendCount < 2
				? EMAIL_VERIFICATION.INITIAL_COOLDOWN_SECONDS
				: EMAIL_VERIFICATION.SUBSEQUENT_COOLDOWN_SECONDS

		if (lastResendAt) {
			const secondsSinceLastResend = (now.getTime() - lastResendAt.getTime()) / 1000

			if (secondsSinceLastResend < currentCooldown) {
				const remainingSeconds = Math.ceil(currentCooldown - secondsSinceLastResend)

				throw new ResendLimitExceededError(
					`Aguarde ${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''} antes de solicitar um novo código.`,
				)
			}
		}

		const verificationSecret = TotpUtils.generateSecret()
		const verificationExpiresAt = new Date(now.getTime() + env.TOTP_STEP_SECONDS * 1000)
		const verificationCode = await TotpUtils.generateCode(verificationSecret)

		const previousVerificationSecret = user.verificationSecret
		const previousVerificationExpiresAt = user.verificationExpiresAt
		const previousResendCount = user.verificationResendCount
		const previousLastResendAt = user.verificationLastResendAt

		await this.userRepository.update(user.id, {
			verificationSecret,
			verificationExpiresAt,
			verificationAttempts: 0,
			verificationLastAttemptAt: null,
			verificationResendCount: resendCount + 1,
			verificationLastResendAt: now,
		})

		try {
			await emailService.sendVerificationCode(user.email, user.name, verificationCode)
		} catch (error) {
			logger.error(
				{
					err: error,
					userId: user.id,
					email: user.email,
				},
				'Failed to send verification email, rolling back database changes',
			)

			await this.userRepository.update(user.id, {
				verificationSecret: previousVerificationSecret,
				verificationExpiresAt: previousVerificationExpiresAt,
				verificationResendCount: previousResendCount,
				verificationLastResendAt: previousLastResendAt,
			})

			throw new EmailSendFailedError(
				'Não foi possível enviar o código de verificação por email. Verifique sua conexão ou tente novamente mais tarde.',
			)
		}

		const remainingAttempts = EMAIL_VERIFICATION.MAX_RESEND_ATTEMPTS - (resendCount + 1)
		const nextCooldown =
			resendCount + 1 < 2
				? EMAIL_VERIFICATION.INITIAL_COOLDOWN_SECONDS
				: EMAIL_VERIFICATION.SUBSEQUENT_COOLDOWN_SECONDS
		const canResendAt = new Date(now.getTime() + nextCooldown * 1000)

		const isBlocked = remainingAttempts <= 0
		const blockedUntil = isBlocked
			? new Date(now.getTime() + EMAIL_VERIFICATION.RESET_WINDOW_HOURS * 60 * 60 * 1000)
			: null

		return {
			success: true,
			message: 'Código de verificação reenviado com sucesso',
			remainingAttempts,
			canResendAt,
			isBlocked,
			blockedUntil,
		}
	}
}
