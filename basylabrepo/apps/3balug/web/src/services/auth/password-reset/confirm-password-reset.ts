import { api } from '@/lib/api'

interface ConfirmPasswordResetResponse {
	success: boolean
	message: string
}

export const confirmPasswordReset = async (
	email: string,
	code: string,
	newPassword: string,
): Promise<ConfirmPasswordResetResponse> => {
	const { data } = await api.post<ConfirmPasswordResetResponse>('/auth/confirm-password-reset', {
		email,
		code,
		newPassword,
	})

	return data
}
