import { PASSWORD_RESET } from "@/constants/auth.constants";
import {
  EmailNotVerifiedError,
  InvalidPasswordResetCodeError,
  PasswordResetCodeExpiredError,
  TooManyRequestsError,
  UserNotFoundError,
  WeakPasswordError,
} from "@/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { CryptoUtils } from "@/utils/crypto.utils";
import { validatePasswordStrength } from "@/utils/password-validator";
import { TotpUtils } from "@/utils/totp.utils";

export interface ConfirmPasswordResetInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface ConfirmPasswordResetOutput {
  success: boolean;
  message: string;
}

export class ConfirmPasswordResetUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ConfirmPasswordResetInput): Promise<ConfirmPasswordResetOutput> {
    const { email, code, newPassword } = input;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UserNotFoundError("Usuário não encontrado.");
    }

    // Usuários criados por admin (sem senha) já têm email verificado
    // Usuários normais precisam verificar email antes de resetar senha
    if (!user.isEmailVerified && user.password !== null) {
      throw new EmailNotVerifiedError(
        "Email não verificado. Por favor, verifique seu email primeiro.",
      );
    }

    // Validate if there's a pending reset code
    if (!user.passwordResetSecret || !user.passwordResetExpiresAt) {
      throw new InvalidPasswordResetCodeError(
        "Nenhum código de recuperação foi solicitado. Solicite um novo código.",
      );
    }

    const now = new Date();

    // Validate if code has not expired
    if (now > user.passwordResetExpiresAt) {
      throw new PasswordResetCodeExpiredError(
        "Código de recuperação expirado. Solicite um novo código.",
      );
    }

    const currentAttempts = user.passwordResetAttempts || 0;
    if (currentAttempts >= PASSWORD_RESET.MAX_CODE_ATTEMPTS) {
      throw new TooManyRequestsError(
        "Você atingiu o limite de tentativas para este código. Solicite um novo código.",
      );
    }

    if (user.passwordResetLastAttemptAt && currentAttempts > 0) {
      const throttleSeconds =
        PASSWORD_RESET.THROTTLE_DELAYS[
          Math.min(currentAttempts, PASSWORD_RESET.THROTTLE_DELAYS.length - 1)
        ];
      const secondsSinceLastAttempt = Math.floor(
        (now.getTime() - user.passwordResetLastAttemptAt.getTime()) / 1000,
      );

      if (secondsSinceLastAttempt < throttleSeconds) {
        const remainingSeconds = throttleSeconds - secondsSinceLastAttempt;
        throw new TooManyRequestsError(
          `Aguarde ${remainingSeconds} segundo${remainingSeconds !== 1 ? "s" : ""} antes de tentar novamente.`,
        );
      }
    }

    // Validate TOTP code
    const isCodeValid = TotpUtils.verifyCode(user.passwordResetSecret, code);
    if (!isCodeValid) {
      // Increment attempts
      const newAttempts = currentAttempts + 1;

      await this.userRepository.update(user.id, {
        passwordResetAttempts: newAttempts,
        passwordResetLastAttemptAt: now,
      });

      const remainingAttempts = PASSWORD_RESET.MAX_CODE_ATTEMPTS - newAttempts;

      throw new InvalidPasswordResetCodeError(
        `Código de recuperação inválido. ${remainingAttempts === 1 ? "Resta 1 tentativa" : `Restam ${remainingAttempts} tentativas`} para este código.`,
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new WeakPasswordError(passwordValidation.errors?.join(", ") || "Senha muito fraca.");
    }

    // Hash the new password
    const hashedPassword = await CryptoUtils.hashPassword(newPassword);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetSecret: null,
      passwordResetExpiresAt: null,
      passwordResetResendCount: 0,
      passwordResetCooldownEndsAt: null,
      passwordResetResendBlocked: false,
      passwordResetResendBlockedUntil: null,
      passwordResetAttempts: 0,
      passwordResetLastAttemptAt: null,
    });

    return {
      success: true,
      message: "Senha redefinida com sucesso. Faça login com sua nova senha.",
    };
  }
}
