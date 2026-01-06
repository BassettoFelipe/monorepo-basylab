import type { User } from '@/db/schema/users'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { ICustomFieldResponseRepository } from '@/repositories/contracts/custom-field-response.repository'
import type { IPlanFeatureRepository } from '@/repositories/contracts/plan-feature.repository'
import type {
	CurrentSubscription,
	ISubscriptionRepository,
} from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { PLAN_FEATURES } from '@/types/features'

type GetMeInput = {
	user: User
	subscription: CurrentSubscription | null
}

type SubscriptionInfo = {
	status: 'active' | 'pending' | 'canceled' | 'expired'
	daysRemaining: number | null
	startDate: Date | null
	endDate: Date | null
	plan: {
		name: string
		price: number
	}
}

type GetMeOutput = {
	user: {
		name: string
		email: string
		role: string
		phone: string | null
		avatarUrl: string | null
		isActive: boolean
		isEmailVerified: boolean
		hasPendingCustomFields: boolean
		subscription: SubscriptionInfo | null
	}
}

export class GetMeUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly subscriptionRepository: ISubscriptionRepository,
		private readonly customFieldRepository: ICustomFieldRepository,
		private readonly customFieldResponseRepository: ICustomFieldResponseRepository,
		private readonly planFeatureRepository: IPlanFeatureRepository,
	) {}

	async execute(input: GetMeInput): Promise<GetMeOutput> {
		const { user } = input
		let { subscription } = input

		if (!subscription && user.createdBy) {
			const owner = await this.userRepository.findById(user.createdBy)
			if (owner) {
				subscription = await this.subscriptionRepository.findCurrentByUserId(owner.id)
			}
		}

		const hasPendingCustomFields = await this.checkPendingCustomFields(user, subscription)

		return {
			user: {
				name: user.name,
				email: user.email,
				role: user.role,
				phone: user.phone ?? null,
				avatarUrl: user.avatarUrl ?? null,
				isActive: user.isActive,
				isEmailVerified: user.isEmailVerified,
				hasPendingCustomFields,
				subscription: subscription
					? {
							status: subscription.computedStatus as 'active' | 'pending' | 'canceled' | 'expired',
							daysRemaining: subscription.daysRemaining,
							startDate: subscription.startDate,
							endDate: subscription.endDate,
							plan: {
								name: subscription.plan.name,
								price: subscription.plan.price,
							},
						}
					: null,
			},
		}
	}

	private async checkPendingCustomFields(
		user: User,
		subscription: CurrentSubscription | null,
	): Promise<boolean> {
		if (!user.createdBy || !user.companyId || !subscription?.plan?.slug) {
			return false
		}

		const hasCustomFieldsFeature = await this.planFeatureRepository.planHasFeature(
			subscription.plan.slug,
			PLAN_FEATURES.CUSTOM_FIELDS,
		)

		if (!hasCustomFieldsFeature) {
			return false
		}

		const activeFields = await this.customFieldRepository.findActiveByCompanyId(user.companyId)

		if (activeFields.length === 0) {
			return false
		}

		const userResponses = await this.customFieldResponseRepository.findByUserId(user.id)

		const requiredFields = activeFields.filter((f) => f.isRequired)
		for (const field of requiredFields) {
			const response = userResponses.find((r) => r.fieldId === field.id)
			if (!response || !response.value || !response.value.trim()) {
				return true
			}
		}

		if (userResponses.length === 0) {
			return true
		}

		return false
	}
}
