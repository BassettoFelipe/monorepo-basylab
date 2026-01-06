import { api } from '@/lib/api'
import type { ConfirmEmailData, ConfirmEmailResponse } from '@/types/auth.types'

export const confirmEmail = async (data: ConfirmEmailData): Promise<ConfirmEmailResponse> => {
	const { data: response } = await api.post<ConfirmEmailResponse>('/auth/confirm-email', data)
	return response
}
