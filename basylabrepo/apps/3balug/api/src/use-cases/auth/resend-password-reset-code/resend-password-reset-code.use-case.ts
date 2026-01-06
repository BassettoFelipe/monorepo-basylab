import { PASSWORD_RESET } from "@/constants/auth.constants";
import {
  EmailNotVerifiedError,
  EmailSendFailedError,
  TooManyAttemptsError,
  UserNotFoundError,
} from "@/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { emailService } from "@/services/email/email.service";
import { TotpUtils } from "@/utils/totp.utils";

export interface ResendPasswordResetCodeInput {
  email: string;
}

export interface ResendPasswordResetCodeOutput {
  remainingResendAttempts: number;
  canResendAt: string;
  codeExpiresAt: string;
}

export class ResendPasswordResetCodeUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ResendPasswordResetCodeInput): Promise<ResendPasswordResetCodeOutput> {
    const { email } = input;
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

    const now = new Date();

    if (
      user.passwordResetResendBlocked &&
      user.passwordResetResendBlockedUntil &&
      user.passwordResetResendBlockedUntil > now
    ) {
      const remainingMinutes = Math.ceil(
        (user.passwordResetResendBlockedUntil.getTime() - now.getTime()) / 60000,
      );
      throw new TooManyAttemptsError(
        `Muitas tentativas de reenvio. Aguarde ${remainingMinutes} minuto(s) para tentar novamente.`,
      );
    }

    if (user.passwordResetCooldownEndsAt && user.passwordResetCooldownEndsAt > now) {
      const remainingSeconds = Math.ceil(
        (user.passwordResetCooldownEndsAt.getTime() - now.getTime()) / 1000,
      );
      throw new TooManyAttemptsError(
        `Aguarde ${remainingSeconds} segundos antes de solicitar um novo código.`,
      );
    }

    const resendCount = user.passwordResetResendCount || 0;
    if (resendCount >= PASSWORD_RESET.MAX_RESEND_ATTEMPTS) {
      // Block resend only (not code attempts)
      const blockedUntil = new Date(
        now.getTime() + PASSWORD_RESET.BLOCK_DURATION_MINUTES * 60 * 1000,
      );

      await this.userRepository.update(user.id, {
        passwordResetResendBlocked: true,
        passwordResetResendBlockedUntil: blockedUntil,
      });

      throw new TooManyAttemptsError(
        `Limite de reenvios atingido. Aguarde ${PASSWORD_RESET.BLOCK_DURATION_MINUTES} minutos para tentar novamente.`,
      );
    }

    // Generate new code
    const secret = TotpUtils.generateSecret();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + Number(process.env.TOTP_STEP_SECONDS || 300));

    const newResendCount = resendCount + 1;
    const cooldownEndsAt = new Date(now.getTime() + PASSWORD_RESET.COOLDOWN_SECONDS * 1000);

    // Store previous values for rollback
    const previousSecret = user.passwordResetSecret;
    const previousExpiresAt = user.passwordResetExpiresAt;
    const previousResendCount = user.passwordResetResendCount;
    const previousCooldownEndsAt = user.passwordResetCooldownEndsAt;
    const previousAttempts = user.passwordResetAttempts;

    await this.userRepository.update(user.id, {
      passwordResetSecret: secret,
      passwordResetExpiresAt: expiresAt,
      passwordResetResendCount: newResendCount,
      passwordResetCooldownEndsAt: cooldownEndsAt,
      // Reset code attempts on resend (new code = new attempts)
      passwordResetAttempts: 0,
    });

    const resetCode = TotpUtils.generateCode(secret);

    try {
      await emailService.sendPasswordResetCode(user.email, user.name, resetCode);
    } catch (_error) {
      // Rollback database changes on email failure
      await this.userRepository.update(user.id, {
        passwordResetSecret: previousSecret,
        passwordResetExpiresAt: previousExpiresAt,
        passwordResetResendCount: previousResendCount,
        passwordResetCooldownEndsAt: previousCooldownEndsAt,
        passwordResetAttempts: previousAttempts,
      });

      throw new EmailSendFailedError(
        "Não foi possível enviar o email de recuperação de senha. Tente novamente mais tarde.",
      );
    }

    return {
      remainingResendAttempts: PASSWORD_RESET.MAX_RESEND_ATTEMPTS - newResendCount,
      canResendAt: cooldownEndsAt.toISOString(),
      codeExpiresAt: expiresAt.toISOString(),
    };
  }
}
