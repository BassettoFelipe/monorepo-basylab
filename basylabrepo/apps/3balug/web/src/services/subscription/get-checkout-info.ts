import { api } from '@/lib/api'
import type { CheckoutInfo } from '@/types/auth.types'

export const getCheckoutInfo = async (checkoutToken: string): Promise<CheckoutInfo> => {
	if (!checkoutToken) {
		throw new Error('Token de checkout não encontrado')
	}

	const { data } = await api.get<CheckoutInfo>('/subscriptions/checkout-info', {
		headers: {
			Authorization: `Bearer ${checkoutToken}`,
		},
	})

	return data
}
