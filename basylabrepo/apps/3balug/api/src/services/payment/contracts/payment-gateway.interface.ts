/**
 * Generic Payment Gateway Interface
 *
 * This interface abstracts payment gateway operations to allow
 * multiple payment providers (Pagar.me, Stripe, etc.) without
 * changing business logic in use cases.
 */

export interface CardTokenizationInput {
	cardNumber: string
	cardholderName: string
	cardExpiration: string // MM/YY format
	securityCode: string
}

export interface CardToken {
	token: string
}

export interface PaymentOrderInput {
	title: string // Product/service description
	quantity: number
	unitPrice: number // Amount in cents
	customerName: string
	customerEmail: string
	customerDocument: string // CPF/CNPJ
	externalReference: string // Your internal tracking ID
	cardToken: string
	installments: number
}

export interface PaymentCharge {
	id: string
	status: PaymentStatus
}

export interface PaymentOrderOutput {
	id: string // Gateway order ID
	status: PaymentStatus
	charges: PaymentCharge[]
}

export interface PaymentStatusInfo {
	id: string
	status: PaymentStatus
	externalReference: string | null // Your internal tracking ID
	customerEmail: string | null
}

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'canceled' | 'refunded'

export interface WebhookEvent {
	type: string
	data: {
		id: string
		[key: string]: unknown
	}
}

export interface WebhookResult {
	success: boolean
	orderId?: string
	status?: PaymentStatus
}

/**
 * Main Payment Gateway Interface
 */
export interface IPaymentGateway {
	/**
	 * Creates a payment order with the gateway
	 */
	createOrder(input: PaymentOrderInput): Promise<PaymentOrderOutput>

	/**
	 * Retrieves order status and information
	 */
	getOrder(orderId: string): Promise<PaymentStatusInfo>

	/**
	 * Processes webhook events from the payment gateway
	 */
	processWebhook(event: WebhookEvent): Promise<WebhookResult>

	/**
	 * Validates webhook signature (if supported by gateway)
	 */
	validateWebhookSignature?(signature: string, payload: string): boolean
}
