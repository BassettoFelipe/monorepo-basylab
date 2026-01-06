import { t } from 'elysia'

export const getPendingPaymentParamsSchema = t.Object({
	id: t.String(),
})

export const getPendingPaymentResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Object({
		id: t.String(),
		email: t.String(),
		name: t.String(),
		planId: t.String(),
		status: t.String(),
		expiresAt: t.String(),
		pagarmeOrderId: t.Optional(t.String()),
		pagarmeChargeId: t.Optional(t.String()),
		plan: t.Object({
			id: t.String(),
			name: t.String(),
			price: t.Number(),
		}),
	}),
})
