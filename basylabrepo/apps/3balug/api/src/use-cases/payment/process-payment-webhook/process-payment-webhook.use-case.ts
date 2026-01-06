import {
	PaymentAlreadyProcessedError,
	PendingPaymentNotFoundError,
	PlanNotFoundError,
} from '@basylab/core/errors'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IUserCacheService } from '@/services/cache'
import type { IPaymentGateway } from '@/services/payment/contracts/payment-gateway.interface'

type ProcessPaymentWebhookInput = {
	type: string
	data: {
		id: string
	}
}

type ProcessPaymentWebhookOutput = {
	success: boolean
	message: string
}

export class ProcessPaymentWebhookUseCase {
	constructor(
		private readonly pendingPaymentRepository: IPendingPaymentRepository,
		private readonly userRepository: IUserRepository,
		readonly _subscriptionRepository: ISubscriptionRepository,
		private readonly planRepository: IPlanRepository,
		private readonly userCacheService: IUserCacheService,
		private readonly paymentGateway: IPaymentGateway,
	) {}

	async execute(input: ProcessPaymentWebhookInput): Promise<ProcessPaymentWebhookOutput> {
		if (input.type !== 'order.paid' && input.type !== 'charge.paid') {
			return {
				success: true,
				message: 'Event type not processed',
			}
		}

		const webhookId = input.data.id

		try {
			const orderInfo = await this.paymentGateway.getOrder(webhookId)

			if (orderInfo.status === 'paid' && orderInfo.externalReference) {
				await this.processApprovedPayment(orderInfo.externalReference, webhookId)
			}

			return {
				success: true,
				message: 'Webhook processed successfully',
			}
		} catch (error) {
			if (error instanceof PaymentAlreadyProcessedError) {
				return {
					success: true,
					message: 'Payment already processed (idempotent)',
				}
			}

			return {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	async processApprovedPayment(externalReference: string, webhookId: string): Promise<void> {
		const pendingPayment = await this.pendingPaymentRepository.findById(externalReference)

		if (!pendingPayment) {
			throw new PendingPaymentNotFoundError()
		}

		const plan = await this.planRepository.findById(pendingPayment.planId)
		if (!plan) {
			throw new PlanNotFoundError()
		}

		const existingUser = await this.userRepository.findByEmail(pendingPayment.email)

		const startDate = new Date()
		const endDate = new Date()
		endDate.setDate(endDate.getDate() + plan.durationDays)

		const result = await this.pendingPaymentRepository.processPaymentWithTransaction({
			pendingPaymentId: pendingPayment.id,
			webhookId,
			userId: existingUser?.id,
			newUser: existingUser
				? undefined
				: {
						email: pendingPayment.email,
						password: pendingPayment.password,
						name: pendingPayment.name,
					},
			subscription: {
				userId: existingUser?.id || '',
				planId: pendingPayment.planId,
				status: 'active',
				startDate,
				endDate,
			},
		})

		await this.userCacheService.invalidate(result.userId)
	}
}
