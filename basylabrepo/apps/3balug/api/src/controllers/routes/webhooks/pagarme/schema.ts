import { t } from 'elysia'

export const pagarmeWebhookBodySchema = t.Object({
	type: t.String(),
	data: t.Any(),
})

export const pagarmeWebhookResponseSchema = t.Object({
	success: t.Boolean(),
	message: t.Optional(t.String()),
})
