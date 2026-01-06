import {
	InvalidInputError,
	PaymentAlreadyProcessedError,
	PaymentExpiredError,
	PaymentGatewayError,
	PendingPaymentNotFoundError,
	PlanNotFoundError,
} from '@basylab/core/errors'
import type { IPendingPaymentRepository } from '@/repositories/contracts/pending-payment.repository'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'
import type { ISubscriptionRepository } from '@/repositories/contracts/subscription.repository'
import type { IUserRepository } from '@/repositories/contracts/user.repository'
import type { IPaymentGateway } from '@/services/payment/contracts/payment-gateway.interface'

type ProcessCreditCardPaymentInput = {
	pendingPaymentId: string
	cardToken: string
	installments: number
}

type ProcessCreditCardPaymentOutput = {
	orderId: string
	status: string
	userId?: string
}

export class ProcessCreditCardPaymentUseCase {
	constructor(
		private readonly pendingPaymentRepository: IPendingPaymentRepository,
		private readonly planRepository: IPlanRepository,
		private readonly userRepository: IUserRepository,
		private readonly subscriptionRepository: ISubscriptionRepository,
		private readonly paymentGateway: IPaymentGateway,
	) {}

	async execute(input: ProcessCreditCardPaymentInput): Promise<ProcessCreditCardPaymentOutput> {
		const pendingPayment = await this.pendingPaymentRepository.findById(input.pendingPaymentId)

		if (!pendingPayment) {
			throw new PendingPaymentNotFoundError()
		}

		if (new Date(pendingPayment.expiresAt) < new Date()) {
			await this.pendingPaymentRepository.update(pendingPayment.id, {
				status: 'expired',
			})
			throw new PaymentExpiredError(
				'Pagamento expirado. Por favor, inicie um novo processo de pagamento.',
			)
		}

		if (pendingPayment.status === 'paid') {
			throw new PaymentAlreadyProcessedError()
		}

		const plan = await this.planRepository.findById(pendingPayment.planId)
		if (!plan) {
			throw new PlanNotFoundError()
		}

		if (input.installments < 1 || input.installments > 12) {
			throw new InvalidInputError('Número de parcelas inválido (1-12)')
		}

		try {
			const order = await this.paymentGateway.createOrder({
				title: `Plano ${plan.name} - CRM Imobiliário`,
				quantity: 1,
				unitPrice: plan.price,
				customerName: pendingPayment.name,
				customerEmail: pendingPayment.email,
				customerDocument: '',
				externalReference: pendingPayment.id,
				cardToken: input.cardToken,
				installments: input.installments,
			})

			await this.pendingPaymentRepository.update(pendingPayment.id, {
				pagarmeOrderId: order.id,
				pagarmeChargeId: order.charges[0]?.id,
			})

			if (order.status === 'paid') {
				const existingUser = await this.userRepository.findByEmail(pendingPayment.email)

				let userId: string

				if (existingUser) {
					userId = existingUser.id
				} else {
					const user = await this.userRepository.create({
						email: pendingPayment.email,
						password: pendingPayment.password,
						name: pendingPayment.name,
					})
					userId = user.id
				}

				const startDate = new Date()
				const endDate = new Date()
				endDate.setDate(endDate.getDate() + plan.durationDays)

				await this.subscriptionRepository.create({
					userId,
					planId: plan.id,
					status: 'active',
					startDate,
					endDate,
				})

				await this.pendingPaymentRepository.update(pendingPayment.id, {
					status: 'paid',
				})

				return {
					orderId: order.id,
					status: order.status,
					userId,
				}
			}

			return {
				orderId: order.id,
				status: order.status,
			}
		} catch (error) {
			await this.pendingPaymentRepository.update(pendingPayment.id, {
				status: 'failed',
			})

			if (error instanceof Error) {
				throw new PaymentGatewayError(
					'Não foi possível processar seu pagamento no momento. Por favor, verifique os dados e tente novamente.',
				)
			}

			throw new PaymentGatewayError(
				'Não foi possível processar seu pagamento no momento. Por favor, tente novamente.',
			)
		}
	}
}
