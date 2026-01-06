import {
  EmailNotVerifiedError,
  OperationNotAllowedError,
  SubscriptionNotFoundError,
  UserNotFoundError,
} from "@/errors";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { CheckoutTokenPayload } from "@/utils/jwt.utils";

type GetCheckoutInfoInput = {
  userId: string;
  checkoutPayload: CheckoutTokenPayload;
};

type GetCheckoutInfoOutput = {
  user: CheckoutTokenPayload["user"];
  subscription: CheckoutTokenPayload["subscription"];
  plan: CheckoutTokenPayload["plan"];
};

export class GetCheckoutInfoUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(input: GetCheckoutInfoInput): Promise<GetCheckoutInfoOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedError();
    }

    const subscription = await this.subscriptionRepository.findById(
      input.checkoutPayload.subscription.id,
    );
    if (!subscription) {
      throw new SubscriptionNotFoundError();
    }

    if (subscription.status !== "pending") {
      throw new OperationNotAllowedError("Esta assinatura já foi processada");
    }

    return {
      user: input.checkoutPayload.user,
      subscription: input.checkoutPayload.subscription,
      plan: input.checkoutPayload.plan,
    };
  }
}
