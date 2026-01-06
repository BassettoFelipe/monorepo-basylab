import { useQuery } from '@tanstack/react-query'
import { getResendStatus } from '@/services/auth/verification/resend-status'

export function useResendStatus(email: string) {
	const query = useQuery({
		queryKey: ['resendStatus', email],
		queryFn: () => getResendStatus(email),
		refetchOnWindowFocus: false,
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
		enabled: !!email,
	})

	return {
		...query,
		canResend: query.data?.canResend ?? true,
		remainingAttempts: query.data?.remainingAttempts ?? 5,
		isBlocked: query.data?.isBlocked ?? false,
		blockedUntil: query.data?.blockedUntil ?? null,
	}
}
