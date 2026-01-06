import { PasswordUtils } from "@basylab/core/crypto";
import {
  EmailAlreadyExistsError,
  EmailNotVerifiedError,
  EmailSendFailedError,
  InternalServerError,
  PlanNotFoundError,
  WeakPasswordError,
} from "@basylab/core/errors";
import { Validators } from "@basylab/core/validation";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { EmailServiceError, emailService } from "@/services/email/email.service";
import { USER_ROLES } from "@/types/roles";
import { TotpUtils } from "@/utils/totp.utils";

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  companyName: string;
  planId: string;
};

type RegisterOutput = {
  userId: string;
  email: string;
  name: string;
  message: string;
};

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly planRepository: IPlanRepository,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const passwordErrors = Validators.validatePasswordStrength(input.password);
    if (passwordErrors.length > 0) {
      throw new WeakPasswordError(`A senha deve conter: ${passwordErrors.join(", ")}`);
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        throw new EmailNotVerifiedError(
          "Conta já existe mas não foi verificada. Por favor, verifique seu email.",
          { email: existingUser.email },
        );
      }

      throw new EmailAlreadyExistsError();
    }

    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new PlanNotFoundError();
    }

    const hashedPassword = await PasswordUtils.hash(input.password);
    const verificationSecret = TotpUtils.generateSecret();
    const verificationExpiresAt = new Date(Date.now() + env.TOTP_STEP_SECONDS * 1000);
    const verificationCode = await TotpUtils.generateCode(verificationSecret);

    const result = await this.createUserWithTransaction({
      normalizedEmail,
      hashedPassword,
      input,
      verificationSecret,
      verificationExpiresAt,
    });

    await this.sendVerificationEmail({
      email: normalizedEmail,
      name: input.name,
      verificationCode,
      userId: result.user.id,
    });

    return {
      userId: result.user.id,
      email: normalizedEmail,
      name: result.user.name,
      message: "Código de verificação enviado para seu email",
    };
  }

  private async createUserWithTransaction(params: {
    normalizedEmail: string;
    hashedPassword: string;
    input: RegisterInput;
    verificationSecret: string;
    verificationExpiresAt: Date;
  }) {
    try {
      return await this.userRepository.registerWithTransaction({
        user: {
          email: params.normalizedEmail,
          password: params.hashedPassword,
          name: params.input.name,
          role: USER_ROLES.OWNER,
          isEmailVerified: false,
          verificationSecret: params.verificationSecret,
          verificationExpiresAt: params.verificationExpiresAt,
          verificationAttempts: 0,
        },
        company: {
          name: params.input.companyName,
          email: params.normalizedEmail,
        },
        subscription: {
          planId: params.input.planId,
          status: "pending",
        },
      });
    } catch (error) {
      logger.error(
        {
          err: error,
          email: params.normalizedEmail,
        },
        "Failed to create user during registration",
      );

      throw new InternalServerError("Erro ao processar cadastro. Tente novamente.");
    }
  }

  private async sendVerificationEmail(params: {
    email: string;
    name: string;
    verificationCode: string;
    userId: string;
  }) {
    try {
      await emailService.sendVerificationCode(params.email, params.name, params.verificationCode);
    } catch (error) {
      logger.error(
        {
          err: error,
          userId: params.userId,
          email: params.email,
        },
        "Failed to send verification email during registration, rolling back user creation",
      );

      await this.userRepository.delete(params.userId);

      if (error instanceof EmailServiceError) {
        throw new EmailSendFailedError(
          "Não foi possível enviar o código de verificação por email. Tente novamente mais tarde.",
        );
      }

      throw new InternalServerError("Erro ao processar cadastro. Tente novamente.");
    }
  }
}
