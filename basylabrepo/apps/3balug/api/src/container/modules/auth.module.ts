import { ConfirmEmailUseCase } from '@/use-cases/auth/confirm-email/confirm-email.use-case'
import { ConfirmPasswordResetUseCase } from '@/use-cases/auth/confirm-password-reset/confirm-password-reset.use-case'
import { GetMeUseCase } from '@/use-cases/auth/get-me/get-me.use-case'
import { GetPasswordResetStatusUseCase } from '@/use-cases/auth/get-password-reset-status/get-password-reset-status.use-case'
import { GetResendStatusUseCase } from '@/use-cases/auth/get-resend-status/get-resend-status.use-case'
import { LoginUseCase } from '@/use-cases/auth/login/login.use-case'
import { RefreshTokensUseCase } from '@/use-cases/auth/refresh-tokens/refresh-tokens.use-case'
import { RegisterUseCase } from '@/use-cases/auth/register/register.use-case'
import { ResendPasswordResetCodeUseCase } from '@/use-cases/auth/resend-password-reset-code/resend-password-reset-code.use-case'
import { ResendVerificationCodeUseCase } from '@/use-cases/auth/resend-verification-code/resend-verification-code.use-case'
import { ValidateEmailForResetUseCase } from '@/use-cases/auth/validate-email-for-reset/validate-email-for-reset.use-case'
import { repositories } from './repositories'

export function createAuthUseCases() {
	return {
		register: new RegisterUseCase(repositories.userRepository, repositories.planRepository),
		login: new LoginUseCase(
			repositories.userRepository,
			repositories.subscriptionRepository,
			repositories.customFieldRepository,
			repositories.planFeatureRepository,
		),
		refreshTokens: new RefreshTokensUseCase(repositories.userRepository),
		confirmEmail: new ConfirmEmailUseCase(
			repositories.userRepository,
			repositories.subscriptionRepository,
			repositories.planRepository,
		),
		resendVerificationCode: new ResendVerificationCodeUseCase(repositories.userRepository),
		getResendStatus: new GetResendStatusUseCase(repositories.userRepository),
		confirmPasswordReset: new ConfirmPasswordResetUseCase(repositories.userRepository),
		getPasswordResetStatus: new GetPasswordResetStatusUseCase(repositories.userRepository),
		validateEmailForReset: new ValidateEmailForResetUseCase(repositories.userRepository),
		resendPasswordResetCode: new ResendPasswordResetCodeUseCase(repositories.userRepository),
		getMe: new GetMeUseCase(
			repositories.userRepository,
			repositories.subscriptionRepository,
			repositories.customFieldRepository,
			repositories.customFieldResponseRepository,
			repositories.planFeatureRepository,
		),
	}
}
