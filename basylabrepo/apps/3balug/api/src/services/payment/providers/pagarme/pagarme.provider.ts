import type {
	IPaymentGateway,
	PaymentOrderInput,
	PaymentOrderOutput,
	PaymentStatus,
	PaymentStatusInfo,
	WebhookEvent,
	WebhookResult,
} from '../../contracts/payment-gateway.interface'

const PAGARME_API_URL = 'https://api.pagar.me/core/v5'

interface PagarmeConfig {
	apiKey: string
	statementDescriptor?: string
}

/**
 * Pagar.me Payment Gateway Provider
 *
 * Implements the generic payment gateway interface for Pagar.me
 */
export class PagarmeProvider implements IPaymentGateway {
	private readonly apiKey: string
	private readonly statementDescriptor: string

	constructor(config: PagarmeConfig) {
		this.apiKey = config.apiKey
		this.statementDescriptor = config.statementDescriptor || 'CRM IMOBIL'
	}

	private getAuthHeader(): string {
		const credentials = `${this.apiKey}:`
		return `Basic ${Buffer.from(credentials).toString('base64')}`
	}

	private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
			...options,
			headers: {
				Authorization: this.getAuthHeader(),
				'Content-Type': 'application/json',
				...options.headers,
			},
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`Pagar.me API error: ${response.status} - ${errorText}`)
		}

		return response.json() as Promise<T>
	}

	/**
	 * Maps Pagar.me status to generic payment status
	 */
	private mapStatus(pagarmeStatus: string): PaymentStatus {
		const statusMap: Record<string, PaymentStatus> = {
			paid: 'paid',
			pending: 'pending',
			failed: 'failed',
			canceled: 'canceled',
			refunded: 'refunded',
			processing: 'pending',
			waiting_payment: 'pending',
		}

		return statusMap[pagarmeStatus] || 'pending'
	}

	async createOrder(input: PaymentOrderInput): Promise<PaymentOrderOutput> {
		const orderBody = {
			code: input.externalReference,
			customer: {
				name: input.customerName,
				email: input.customerEmail,
				document: input.customerDocument,
				type: 'individual',
			},
			items: [
				{
					amount: input.unitPrice,
					description: input.title,
					quantity: input.quantity,
				},
			],
			payments: [
				{
					payment_method: 'credit_card',
					credit_card: {
						installments: input.installments,
						statement_descriptor: this.statementDescriptor,
						card_token: input.cardToken,
					},
				},
			],
			metadata: {
				external_reference: input.externalReference,
			},
			closed: true,
		}

		const order = await this.makeRequest<{
			id: string
			status: string
			charges: Array<{
				id: string
				status: string
			}>
		}>('/orders', {
			method: 'POST',
			body: JSON.stringify(orderBody),
		})

		return {
			id: order.id,
			status: this.mapStatus(order.status),
			charges: order.charges.map((charge) => ({
				id: charge.id,
				status: this.mapStatus(charge.status),
			})),
		}
	}

	async getOrder(orderId: string): Promise<PaymentStatusInfo> {
		const order = await this.makeRequest<{
			id?: string
			status?: string
			code?: string
			customer?: { email?: string }
		}>(`/orders/${orderId}`, {
			method: 'GET',
		})

		return {
			id: order.id || '',
			status: this.mapStatus(order.status || ''),
			externalReference: order.code || null,
			customerEmail: order.customer?.email || null,
		}
	}

	async processWebhook(event: WebhookEvent): Promise<WebhookResult> {
		// Pagar.me sends events like "order.paid", "charge.paid", etc.
		const isPaidEvent = event.type === 'order.paid' || event.type === 'charge.paid'

		if (!isPaidEvent) {
			// Ignore non-payment events
			return { success: true }
		}

		// For paid events, we need to fetch the order details
		const orderId = event.data.id
		const orderInfo = await this.getOrder(orderId)

		return {
			success: true,
			orderId: orderInfo.id,
			status: orderInfo.status,
		}
	}

	/**
	 * Pagar.me doesn't provide webhook signature validation in their API.
	 * If signature validation is needed in the future, consider implementing
	 * IP whitelist validation or custom HMAC signing on the application level.
	 */
	validateWebhookSignature(_signature: string, _payload: string): boolean {
		return true
	}
}
