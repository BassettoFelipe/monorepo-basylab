import { Elysia } from 'elysia'
import { container } from '@/container'
import { apiKeyMiddleware } from '@/controllers/middlewares'
import { billingWebhookBodySchema, billingWebhookResponseSchema } from './schema'

export const billingWebhookController = new Elysia().guard({ as: 'local' }, (app) =>
	app.use(apiKeyMiddleware).post(
		'/api/v1/billing/webhook',
		async ({ body, tenant }) => {
			const result = await container.billing.create.execute({
				tenantId: tenant.id,
				externalCustomerId: body.customerId,
				customerEmail: body.customerEmail,
				planSlug: body.planSlug,
				amountCents: body.amountCents,
				currency: body.currency,
				status: body.status,
				metadata: body.metadata,
			})
			return result
		},
		{
			body: billingWebhookBodySchema,
			response: {
				200: billingWebhookResponseSchema,
			},
		},
	),
)
