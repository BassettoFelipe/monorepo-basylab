import { api } from '@/lib/api'

export interface ValidateEmailForResetResponse {
	email: string
}

export const validateEmailForReset = async (
	email: string,
): Promise<ValidateEmailForResetResponse> => {
	const { data } = await api.post<ValidateEmailForResetResponse>('/auth/validate-email-for-reset', {
		email,
	})

	return data
}
