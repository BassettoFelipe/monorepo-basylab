import type { IPaymentGateway } from './contracts/payment-gateway.interface'

/**
 * Payment Gateway Service
 *
 * Lazy-loaded getter for the configured payment gateway from the DI container.
 * To change the payment provider, update the configuration in services/container.ts
 */

let _paymentGateway: IPaymentGateway | null = null

export function getPaymentGatewayInstance(): IPaymentGateway {
	if (!_paymentGateway) {
		const { getPaymentGateway } = require('@/services/container')
		_paymentGateway = getPaymentGateway()
	}
	return _paymentGateway as IPaymentGateway
}

export const paymentGateway = new Proxy({} as IPaymentGateway, {
	get(_target, prop: string | symbol): unknown {
		const service = getPaymentGatewayInstance()
		const value = service[prop as keyof IPaymentGateway]
		return typeof value === 'function'
			? (value as (...args: never[]) => unknown).bind(service)
			: value
	},
})

export type {
	IPaymentGateway,
	PaymentOrderInput,
	PaymentOrderOutput,
	PaymentStatus,
	PaymentStatusInfo,
	WebhookEvent,
	WebhookResult,
} from './contracts/payment-gateway.interface'
