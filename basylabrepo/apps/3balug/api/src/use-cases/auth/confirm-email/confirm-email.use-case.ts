import {
  AccountAlreadyVerifiedError,
  InvalidVerificationCodeError,
  PlanNotFoundError,
  SubscriptionNotFoundError,
  TooManyRequestsError,
  UserNotFoundError,
  VerificationCodeExpiredError,
} from "@basylab/core/errors";
import { env } from "@/config/env";
import { EMAIL_VERIFICATION } from "@/constants/auth.constants";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { JwtUtils } from "@/utils/jwt.utils";
import { TotpUtils } from "@/utils/totp.utils";

interface ConfirmEmailInput {
  email: string;
  code: string;
}

interface ConfirmEmailOutput {
  checkoutToken: string;
  checkoutExpiresAt: string;
}

export class ConfirmEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planRepository: IPlanRepository,
  ) {}

  async execute(input: ConfirmEmailInput): Promise<ConfirmEmailOutput> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.isEmailVerified) {
      throw new AccountAlreadyVerifiedError();
    }

    if (!user.verificationSecret || !user.verificationExpiresAt) {
      throw new InvalidVerificationCodeError("Nenhum código de verificação foi solicitado");
    }

    if (new Date() > user.verificationExpiresAt) {
      throw new VerificationCodeExpiredError();
    }

    const currentAttempts = user.verificationAttempts || 0;

    if (currentAttempts >= EMAIL_VERIFICATION.MAX_CODE_ATTEMPTS) {
      throw new TooManyRequestsError(
        "Você atingiu o limite de tentativas para este código. Solicite um novo código.",
      );
    }

    if (user.verificationLastAttemptAt && currentAttempts > 0) {
      const throttleSeconds =
        EMAIL_VERIFICATION.THROTTLE_DELAYS[
          Math.min(currentAttempts, EMAIL_VERIFICATION.THROTTLE_DELAYS.length - 1)
        ];
      const secondsSinceLastAttempt = Math.floor(
        (Date.now() - user.verificationLastAttemptAt.getTime()) / 1000,
      );

      if (secondsSinceLastAttempt < throttleSeconds) {
        const remainingSeconds = throttleSeconds - secondsSinceLastAttempt;
        throw new TooManyRequestsError(
          `Aguarde ${remainingSeconds} segundo${remainingSeconds !== 1 ? "s" : ""} antes de tentar novamente.`,
        );
      }
    }

    const isValidCode = await TotpUtils.verifyCode(user.verificationSecret, input.code);
    if (!isValidCode) {
      const newAttempts = currentAttempts + 1;
      const now = new Date();

      await this.userRepository.update(user.id, {
        verificationAttempts: newAttempts,
        verificationLastAttemptAt: now,
      });

      const remainingAttempts = EMAIL_VERIFICATION.MAX_CODE_ATTEMPTS - newAttempts;

      throw new InvalidVerificationCodeError(
        `Código de verificação inválido. ${remainingAttempts === 1 ? "Resta 1 tentativa" : `Restam ${remainingAttempts} tentativas`} para este código.`,
      );
    }

    const subscription = await this.subscriptionRepository.findByUserId(user.id);
    if (!subscription) {
      throw new SubscriptionNotFoundError();
    }

    if (subscription.status !== "pending") {
      throw new AccountAlreadyVerifiedError(
        "Esta assinatura já foi processada. Você pode fazer login normalmente.",
      );
    }

    const plan = await this.planRepository.findById(subscription.planId);
    if (!plan) {
      throw new PlanNotFoundError();
    }

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      verificationSecret: null,
      verificationExpiresAt: null,
    });

    const checkoutToken = await JwtUtils.generateToken(user.id, "checkout", {
      purpose: "checkout",
      user: {
        name: user.name,
        email: user.email,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        features: plan.features,
      },
    });

    const expiresInSeconds = JwtUtils.parseExpirationToSeconds(env.JWT_CHECKOUT_EXPIRES_IN);
    const checkoutExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return {
      checkoutToken,
      checkoutExpiresAt,
    };
  }
}
