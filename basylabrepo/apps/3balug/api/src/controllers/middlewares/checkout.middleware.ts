import { BadRequestError, InvalidTokenError } from '@basylab/core/errors'
import { Elysia } from 'elysia'
import { type CheckoutTokenPayload, JwtUtils } from '@/utils/jwt.utils'

/**
 * Context derived from checkout authentication middleware
 */
export interface CheckoutContext extends Record<string, unknown> {
	checkoutPayload: CheckoutTokenPayload
	userId: string
	userName: string
	userEmail: string
	subscriptionId: string
	subscriptionStatus: string
	planId: string
	planName: string
	planPrice: number
	planFeatures: string[]
}

/**
 * Parses the Authorization header and extracts the Bearer token
 * @returns The token string or null if invalid format
 */
function extractBearerToken(authorization: string | undefined): string | null {
	if (!authorization) {
		return null
	}

	const parts = authorization.split(' ')
	if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
		return null
	}

	return parts[1]
}

/**
 * Creates a checkout authentication middleware that validates checkout JWT tokens
 * Derives checkout information from the token and makes it available to route handlers
 *
 * @example
 * app.use(requireCheckout)
 *    .post('/subscriptions/activate', ({ userId, subscriptionId, planId }) => ...)
 */
export const requireCheckout = new Elysia({
	name: 'checkout-middleware',
}).derive({ as: 'scoped' }, async ({ headers }): Promise<CheckoutContext> => {
	const token = extractBearerToken(headers.authorization)

	if (!token) {
		throw new BadRequestError('Token de checkout não fornecido')
	}

	const payload = (await JwtUtils.verifyToken(token, 'checkout')) as CheckoutTokenPayload | null

	if (!payload || payload.purpose !== 'checkout') {
		throw new InvalidTokenError(
			'Sessão de checkout expirada. Por favor, faça login para continuar.',
		)
	}

	return {
		checkoutPayload: payload,
		userId: payload.sub,
		userName: payload.user.name,
		userEmail: payload.user.email,
		subscriptionId: payload.subscription.id,
		subscriptionStatus: payload.subscription.status,
		planId: payload.plan.id,
		planName: payload.plan.name,
		planPrice: payload.plan.price,
		planFeatures: payload.plan.features,
	}
})

/**
 * Factory function to create a new checkout middleware instance
 * Use this in tests to avoid singleton state issues
 */
export const createCheckoutMiddleware = () =>
	new Elysia({
		name: 'checkout-middleware',
	}).derive({ as: 'scoped' }, async ({ headers }): Promise<CheckoutContext> => {
		const token = extractBearerToken(headers.authorization)

		if (!token) {
			throw new BadRequestError('Token de checkout não fornecido')
		}

		const payload = (await JwtUtils.verifyToken(token, 'checkout')) as CheckoutTokenPayload | null

		if (!payload || payload.purpose !== 'checkout') {
			throw new InvalidTokenError(
				'Sessão de checkout expirada. Por favor, faça login para continuar.',
			)
		}

		return {
			checkoutPayload: payload,
			userId: payload.sub,
			userName: payload.user.name,
			userEmail: payload.user.email,
			subscriptionId: payload.subscription.id,
			subscriptionStatus: payload.subscription.status,
			planId: payload.plan.id,
			planName: payload.plan.name,
			planPrice: payload.plan.price,
			planFeatures: payload.plan.features,
		}
	})
