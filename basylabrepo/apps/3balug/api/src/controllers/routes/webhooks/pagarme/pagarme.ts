import { Elysia } from 'elysia'
import { payment } from '@/container'
import { pagarmeWebhookBodySchema, pagarmeWebhookResponseSchema } from './schema'

export const pagarmeWebhookController = new Elysia().post(
	'/webhooks/pagarme',
	async ({ body, set }) => {
		const result = await payment.processWebhook.execute(body)

		set.status = 200
		return result
	},
	{
		body: pagarmeWebhookBodySchema,
		response: {
			200: pagarmeWebhookResponseSchema,
		},
	},
)
