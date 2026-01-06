import { ActivateSubscriptionUseCase } from '@/use-cases/subscription/activate-subscription/activate-subscription.use-case'
import { ChangePlanUseCase } from '@/use-cases/subscription/change-plan/change-plan.use-case'
import { GetCheckoutInfoUseCase } from '@/use-cases/subscription/get-checkout-info/get-checkout-info.use-case'
import { repositories } from './repositories'
import { services } from './services'

export function createSubscriptionUseCases() {
	return {
		getCheckoutInfo: new GetCheckoutInfoUseCase(
			repositories.userRepository,
			repositories.subscriptionRepository,
		),
		changePlan: new ChangePlanUseCase(
			repositories.subscriptionRepository,
			repositories.planRepository,
		),
		activate: new ActivateSubscriptionUseCase(
			repositories.subscriptionRepository,
			repositories.planRepository,
			repositories.userRepository,
			services.userCacheService,
		),
	}
}
