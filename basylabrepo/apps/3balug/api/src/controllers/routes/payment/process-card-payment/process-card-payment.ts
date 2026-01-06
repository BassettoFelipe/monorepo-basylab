import { Elysia } from 'elysia'
import { payment } from '@/container'
import { processCardPaymentSchema } from './schema'

export const processCardPaymentController = new Elysia().post(
	'/payment/process-card-payment',
	async ({ body, set }) => {
		const result = await payment.processCardPayment.execute(body)

		set.status = 200
		return {
			success: true,
			message: 'Pagamento processado com sucesso',
			data: result,
		}
	},
	{
		body: processCardPaymentSchema,
	},
)
