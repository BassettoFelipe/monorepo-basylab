import {
	EmailNotVerifiedError,
	EmailSendFailedError,
	UserNotFoundError,
} from '@basylab/core/errors'
import { PASSWORD_RESET } from '@/constants/auth.constants'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { emailService } from '@/services/email/email.service'
import { TotpUtils } from '@/utils/totp.utils'

interface GetPasswordResetStatusInput {
	email: string
}

interface GetPasswordResetStatusOutput {
	canResend: boolean
	remainingResendAttempts: number
	canResendAt: string | null
	remainingCodeAttempts: number
	canTryCodeAt: string | null
	isResendBlocked: boolean
	resendBlockedUntil: string | null
	codeExpiresAt: string | null
}

export class GetPasswordResetStatusUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(input: GetPasswordResetStatusInput): Promise<GetPasswordResetStatusOutput> {
		const normalizedEmail = input.email.toLowerCase().trim()

		const user = await this.userRepository.findByEmail(normalizedEmail)
		if (!user) {
			throw new UserNotFoundError('Usuário não encontrado.')
		}

		// Usuários criados por admin (sem senha) já têm email verificado
		// Usuários normais precisam verificar email antes de resetar senha
		if (!user.isEmailVerified && user.password !== null) {
			throw new EmailNotVerifiedError(
				'Email não verificado. Por favor, verifique seu email primeiro.',
			)
		}

		const now = new Date()

		const isResendBlocked =
			!!user.passwordResetResendBlocked &&
			!!user.passwordResetResendBlockedUntil &&
			user.passwordResetResendBlockedUntil > now

		// If resend block time has passed, reset the resend block
		if (
			user.passwordResetResendBlocked &&
			user.passwordResetResendBlockedUntil &&
			user.passwordResetResendBlockedUntil <= now
		) {
			await this.userRepository.update(user.id, {
				passwordResetResendBlocked: false,
				passwordResetResendBlockedUntil: null,
				passwordResetResendCount: 0,
			})
		}

		const hasActiveCode =
			user.passwordResetSecret && user.passwordResetExpiresAt && user.passwordResetExpiresAt > now

		if (!hasActiveCode) {
			// Send first email
			const secret = TotpUtils.generateSecret()
			const expiresAt = new Date()
			expiresAt.setSeconds(expiresAt.getSeconds() + Number(process.env.TOTP_STEP_SECONDS || 300))

			// Store previous values for rollback
			const previousSecret = user.passwordResetSecret
			const previousExpiresAt = user.passwordResetExpiresAt
			const previousResendCount = user.passwordResetResendCount
			const previousCooldownEndsAt = user.passwordResetCooldownEndsAt
			const previousAttempts = user.passwordResetAttempts
			const previousLastAttemptAt = user.passwordResetLastAttemptAt
			const previousResendBlocked = user.passwordResetResendBlocked
			const previousResendBlockedUntil = user.passwordResetResendBlockedUntil

			await this.userRepository.update(user.id, {
				passwordResetSecret: secret,
				passwordResetExpiresAt: expiresAt,
				passwordResetResendCount: 0,
				passwordResetCooldownEndsAt: null,
				passwordResetAttempts: 0,
				passwordResetLastAttemptAt: null,
				passwordResetResendBlocked: false,
				passwordResetResendBlockedUntil: null,
			})

			const resetCode = await TotpUtils.generateCode(secret)

			try {
				await emailService.sendPasswordResetCode(user.email, user.name, resetCode)
			} catch (_error) {
				// Rollback database changes on email failure
				await this.userRepository.update(user.id, {
					passwordResetSecret: previousSecret,
					passwordResetExpiresAt: previousExpiresAt,
					passwordResetResendCount: previousResendCount,
					passwordResetCooldownEndsAt: previousCooldownEndsAt,
					passwordResetAttempts: previousAttempts,
					passwordResetLastAttemptAt: previousLastAttemptAt,
					passwordResetResendBlocked: previousResendBlocked,
					passwordResetResendBlockedUntil: previousResendBlockedUntil,
				})

				throw new EmailSendFailedError(
					'Não foi possível enviar o email de recuperação de senha. Tente novamente mais tarde.',
				)
			}

			return {
				canResend: true,
				remainingResendAttempts: PASSWORD_RESET.MAX_RESEND_ATTEMPTS,
				canResendAt: null,
				remainingCodeAttempts: PASSWORD_RESET.MAX_CODE_ATTEMPTS,
				canTryCodeAt: null,
				isResendBlocked: false,
				resendBlockedUntil: null,
				codeExpiresAt: expiresAt.toISOString(),
			}
		}

		// Has active code - return status without sending email
		const resendCount = user.passwordResetResendCount || 0
		const remainingResendAttempts = Math.max(0, PASSWORD_RESET.MAX_RESEND_ATTEMPTS - resendCount)

		const codeAttempts = user.passwordResetAttempts || 0
		const remainingCodeAttempts = Math.max(0, PASSWORD_RESET.MAX_CODE_ATTEMPTS - codeAttempts)

		let canTryCodeAt: string | null = null
		if (user.passwordResetLastAttemptAt) {
			const attemptIndex = Math.min(codeAttempts, PASSWORD_RESET.THROTTLE_DELAYS.length - 1)
			const requiredDelay = PASSWORD_RESET.THROTTLE_DELAYS[attemptIndex]
			const nextAttemptTime = new Date(
				user.passwordResetLastAttemptAt.getTime() + requiredDelay * 1000,
			)
			if (nextAttemptTime > now) {
				canTryCodeAt = nextAttemptTime.toISOString()
			}
		}

		let canResendAt: string | null = null
		if (user.passwordResetCooldownEndsAt && user.passwordResetCooldownEndsAt > now) {
			canResendAt = user.passwordResetCooldownEndsAt.toISOString()
		}

		const canResend = !isResendBlocked && canResendAt === null && remainingResendAttempts > 0

		return {
			canResend,
			remainingResendAttempts: isResendBlocked ? 0 : remainingResendAttempts,
			canResendAt,
			remainingCodeAttempts,
			canTryCodeAt,
			isResendBlocked,
			resendBlockedUntil: user.passwordResetResendBlockedUntil?.toISOString() || null,
			codeExpiresAt: user.passwordResetExpiresAt?.toISOString() || null,
		}
	}
}
