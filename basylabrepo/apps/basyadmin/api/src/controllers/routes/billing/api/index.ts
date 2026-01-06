import { Elysia } from 'elysia'
import { billingWebhookController } from './webhook/webhook'

export const billingApiRoutes = new Elysia().use(billingWebhookController)
