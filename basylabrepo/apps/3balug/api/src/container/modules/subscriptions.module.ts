import { ActivateSubscriptionUseCase } from "@/use-cases/subscription/activate-subscription/activate-subscription.use-case";
import { ChangePlanUseCase } from "@/use-cases/subscription/change-plan/change-plan.use-case";
import { GetCheckoutInfoUseCase } from "@/use-cases/subscription/get-checkout-info/get-checkout-info.use-case";
import { planRepository, subscriptionRepository, userRepository } from "./repositories";
import { userCacheService } from "./services";

export function createSubscriptionUseCases() {
  return {
    getCheckoutInfo: new GetCheckoutInfoUseCase(userRepository, subscriptionRepository),
    changePlan: new ChangePlanUseCase(subscriptionRepository, planRepository),
    activate: new ActivateSubscriptionUseCase(
      subscriptionRepository,
      planRepository,
      userRepository,
      userCacheService,
    ),
  };
}
