import { api } from '@/lib/api'

export interface PasswordResetStatus {
	canResend: boolean
	remainingResendAttempts: number
	canResendAt: string | null
	remainingCodeAttempts: number
	canTryCodeAt: string | null
	isResendBlocked: boolean
	resendBlockedUntil: string | null
	codeExpiresAt: string | null
}

export const getPasswordResetStatus = async (email: string): Promise<PasswordResetStatus> => {
	const { data } = await api.get<PasswordResetStatus>('/auth/password-reset-status', {
		params: { email },
	})

	return data
}
