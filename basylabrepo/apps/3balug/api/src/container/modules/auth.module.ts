import { ConfirmEmailUseCase } from "@/use-cases/auth/confirm-email/confirm-email.use-case";
import { ConfirmPasswordResetUseCase } from "@/use-cases/auth/confirm-password-reset/confirm-password-reset.use-case";
import { GetMeUseCase } from "@/use-cases/auth/get-me/get-me.use-case";
import { GetPasswordResetStatusUseCase } from "@/use-cases/auth/get-password-reset-status/get-password-reset-status.use-case";
import { GetResendStatusUseCase } from "@/use-cases/auth/get-resend-status/get-resend-status.use-case";
import { LoginUseCase } from "@/use-cases/auth/login/login.use-case";
import { RefreshTokensUseCase } from "@/use-cases/auth/refresh-tokens/refresh-tokens.use-case";
import { RegisterUseCase } from "@/use-cases/auth/register/register.use-case";
import { ResendPasswordResetCodeUseCase } from "@/use-cases/auth/resend-password-reset-code/resend-password-reset-code.use-case";
import { ResendVerificationCodeUseCase } from "@/use-cases/auth/resend-verification-code/resend-verification-code.use-case";
import { ValidateEmailForResetUseCase } from "@/use-cases/auth/validate-email-for-reset/validate-email-for-reset.use-case";
import {
  customFieldRepository,
  customFieldResponseRepository,
  planFeatureRepository,
  planRepository,
  subscriptionRepository,
  userRepository,
} from "./repositories";

export function createAuthUseCases() {
  return {
    register: new RegisterUseCase(userRepository, planRepository),
    login: new LoginUseCase(
      userRepository,
      subscriptionRepository,
      customFieldRepository,
      planFeatureRepository,
    ),
    refreshTokens: new RefreshTokensUseCase(userRepository),
    confirmEmail: new ConfirmEmailUseCase(userRepository, subscriptionRepository, planRepository),
    resendVerificationCode: new ResendVerificationCodeUseCase(userRepository),
    getResendStatus: new GetResendStatusUseCase(userRepository),
    confirmPasswordReset: new ConfirmPasswordResetUseCase(userRepository),
    getPasswordResetStatus: new GetPasswordResetStatusUseCase(userRepository),
    validateEmailForReset: new ValidateEmailForResetUseCase(userRepository),
    resendPasswordResetCode: new ResendPasswordResetCodeUseCase(userRepository),
    getMe: new GetMeUseCase(
      userRepository,
      subscriptionRepository,
      customFieldRepository,
      customFieldResponseRepository,
      planFeatureRepository,
    ),
  };
}
