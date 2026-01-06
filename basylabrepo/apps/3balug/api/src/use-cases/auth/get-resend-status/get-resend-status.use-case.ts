import { AccountAlreadyVerifiedError, UserNotFoundError } from '@basylab/core/errors'
import { EMAIL_VERIFICATION } from '@/constants/auth.constants'
import type { IUserRepository } from '@/repositories/contracts/user.repository'

interface GetResendStatusOutput {
	remainingAttempts: number
	canResendAt: Date | null
	canResend: boolean
	isBlocked: boolean
	blockedUntil: Date | null
}

export class GetResendStatusUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(email: string): Promise<GetResendStatusOutput> {
		const normalizedEmail = email.toLowerCase().trim()
		const user = await this.userRepository.findByEmail(normalizedEmail)

		if (!user) throw new UserNotFoundError()
		if (user.isEmailVerified) throw new AccountAlreadyVerifiedError()

		const now = new Date()
		const lastResendAt = user.verificationLastResendAt

		const hoursSinceLastResend = lastResendAt
			? (now.getTime() - lastResendAt.getTime()) / (1000 * 60 * 60)
			: Number.POSITIVE_INFINITY

		const resendCount =
			hoursSinceLastResend >= EMAIL_VERIFICATION.RESET_WINDOW_HOURS
				? 0
				: user.verificationResendCount || 0

		const remainingAttempts = EMAIL_VERIFICATION.MAX_RESEND_ATTEMPTS - resendCount

		if (remainingAttempts <= 0) {
			return {
				remainingAttempts,
				canResendAt: null,
				canResend: false,
				isBlocked: true,
				blockedUntil: lastResendAt
					? new Date(
							lastResendAt.getTime() + EMAIL_VERIFICATION.RESET_WINDOW_HOURS * 60 * 60 * 1000,
						)
					: null,
			}
		}

		if (!lastResendAt) {
			return {
				remainingAttempts,
				canResendAt: null,
				canResend: true,
				isBlocked: false,
				blockedUntil: null,
			}
		}

		const currentCooldown =
			resendCount < 2
				? EMAIL_VERIFICATION.INITIAL_COOLDOWN_SECONDS
				: EMAIL_VERIFICATION.SUBSEQUENT_COOLDOWN_SECONDS
		const secondsSinceLastResend = (now.getTime() - lastResendAt.getTime()) / 1000
		const isInCooldown = secondsSinceLastResend <= currentCooldown

		return {
			remainingAttempts,
			canResendAt: isInCooldown ? new Date(lastResendAt.getTime() + currentCooldown * 1000) : null,
			canResend: !isInCooldown,
			isBlocked: false,
			blockedUntil: null,
		}
	}
}
