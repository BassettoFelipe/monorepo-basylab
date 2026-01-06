import { api } from '@/lib/api'

interface ProcessCardPaymentInput {
	pendingPaymentId: string
	cardToken: string
	installments: number
}

export const processCardPayment = async (input: ProcessCardPaymentInput) => {
	const { data } = await api.post('/payments/process-card', input)
	return data
}
