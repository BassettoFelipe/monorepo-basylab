import { api } from '@/lib/api'
import type { LoginResponse } from '@/types/auth.types'
import { storage } from '@/utils/storage'

export const login = async (email: string, password: string): Promise<LoginResponse> => {
	const { data } = await api.post<LoginResponse>(
		'/auth/login',
		{
			email,
			password,
		},
		{
			withCredentials: true,
		},
	)

	if (data.data.accessToken) {
		storage.setAccessToken(data.data.accessToken)
	}

	// Cacheia dados essenciais do usuário para uso imediato (evita flickering)
	if (data.data.user) {
		if (data.data.user.role) {
			storage.setUserRole(data.data.user.role)
		}
		if (data.data.user.name) {
			storage.setUserName(data.data.user.name)
		}
		if (data.data.user.createdBy !== undefined) {
			storage.setUserCreatedBy(data.data.user.createdBy || '')
		}
		// Salva hasPendingCustomFields para validação local imediata no AppRouter
		storage.setHasPendingCustomFields(data.data.user.hasPendingCustomFields ?? false)
	}

	if (data.data.subscription) {
		if (data.data.subscription.status) {
			storage.setSubscriptionStatus(data.data.subscription.status)
		}
		if (data.data.subscription.plan?.name) {
			storage.setPlanName(data.data.subscription.plan.name)
		}
	}

	return data
}
