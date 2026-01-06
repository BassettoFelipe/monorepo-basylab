import { PasswordUtils } from '@basylab/core/crypto'
import {
	AccountDeactivatedError,
	EmailNotVerifiedError,
	InvalidCredentialsError,
	SubscriptionRequiredError,
} from '@basylab/core/errors'
import { env } from '@/config/env'
import type { ICustomFieldRepository } from '@/repositories/contracts/custom-field.repository'
import type { IPlanFeatureRepository } from '@/repositories/contracts/plan-feature.repository'
import type {
	ISubscriptionRepository,
	SubscriptionStatus,
} from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import { PLAN_FEATURES } from '@/types/features'
import { JwtUtils } from '@/utils/jwt.utils'

type LoginInput = {
	email: string
	password: string
}

type LoginOutput = {
	user: {
		id: string
		email: string
		name: string
		role: string
		hasPendingCustomFields: boolean
	}
	subscription: {
		id: string
		status: SubscriptionStatus
		startDate: Date | null
		endDate: Date | null
		plan: {
			id: string
			name: string
			price: number
			features: string[]
		}
		daysRemaining: number | null
	}
	accessToken: string
	refreshToken: string
	checkoutToken?: string
	checkoutExpiresAt?: string
}

export class LoginUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly subscriptionRepository: ISubscriptionRepository,
		private readonly customFieldRepository: ICustomFieldRepository,
		private readonly planFeatureRepository: IPlanFeatureRepository,
	) {}

	async execute(input: LoginInput): Promise<LoginOutput> {
		const normalizedEmail = input.email.toLowerCase().trim()
		const user = await this.userRepository.findByEmail(normalizedEmail)

		if (!user?.password) {
			throw new InvalidCredentialsError()
		}

		const isPasswordValid = await PasswordUtils.verify(input.password, user.password)

		if (!isPasswordValid) {
			throw new InvalidCredentialsError()
		}

		if (!user.isEmailVerified) {
			throw new EmailNotVerifiedError(
				'Sua conta ainda não foi verificada. Por favor, verifique seu email.',
				{ email: user.email },
			)
		}

		if (!user.isActive) {
			throw new AccountDeactivatedError()
		}

		let subscription = await this.subscriptionRepository.findCurrentByUserId(user.id)

		if (!subscription && user.createdBy) {
			const owner = await this.userRepository.findById(user.createdBy)
			if (owner) {
				subscription = await this.subscriptionRepository.findCurrentByUserId(owner.id)
			}
		}

		if (!subscription) {
			throw new SubscriptionRequiredError(
				'Você ainda não possui uma assinatura. Complete o cadastro para continuar.',
			)
		}

		const [accessToken, refreshToken] = await Promise.all([
			JwtUtils.generateToken(user.id, 'access', {
				role: user.role,
				companyId: user.companyId,
			}),
			JwtUtils.generateToken(user.id, 'refresh', {
				role: user.role,
				companyId: user.companyId,
			}),
		])

		let checkoutData = {}
		if (subscription.computedStatus === 'pending') {
			const checkoutToken = await JwtUtils.generateToken(user.id, 'checkout', {
				purpose: 'checkout',
				user: { name: user.name, email: user.email },
				subscription: {
					id: subscription.id,
					status: subscription.status,
				},
				plan: subscription.plan,
			})
			const expiresInSeconds = JwtUtils.parseExpirationToSeconds(env.JWT_CHECKOUT_EXPIRES_IN)
			const checkoutExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()
			checkoutData = { checkoutToken, checkoutExpiresAt }
		}

		const shouldCheckCustomFields =
			user.createdBy &&
			user.companyId &&
			subscription.plan?.slug &&
			(await this.planFeatureRepository.planHasFeature(
				subscription.plan.slug,
				PLAN_FEATURES.CUSTOM_FIELDS,
			))

		const hasPendingCustomFields =
			shouldCheckCustomFields && user.companyId
				? await this.customFieldRepository.hasUserPendingRequiredFields(user.id, user.companyId)
				: false

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				hasPendingCustomFields,
			},
			subscription: {
				id: subscription.id,
				status: subscription.computedStatus,
				startDate: subscription.startDate,
				endDate: subscription.endDate,
				plan: {
					id: subscription.plan.id,
					name: subscription.plan.name,
					price: subscription.plan.price,
					features: subscription.plan.features,
				},
				daysRemaining: subscription.daysRemaining,
			},
			accessToken,
			refreshToken,
			...checkoutData,
		}
	}
}
