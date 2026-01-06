import { useQuery, useQueryClient } from '@tanstack/react-query'
import { me } from '@/services/auth/session/me'
import type { User } from '@/types/user.types'
import { storage } from '@/utils/storage'
import { queryKeys } from '../queryKeys'

/**
 * Busca dados do usuário da API e sincroniza com localStorage.
 * Se a API retornar erro 401/403, o interceptor do axios cuida do logout.
 */
const fetchUser = async (): Promise<User> => {
	const response = await me()

	// Sincroniza localStorage com dados frescos da API
	if (response.user) {
		if (response.user.role) {
			storage.setUserRole(response.user.role)
		}
		if (response.user.name) {
			storage.setUserName(response.user.name)
		}
		if (response.user.avatarUrl) {
			storage.setUserAvatarUrl(response.user.avatarUrl)
		}
		if (response.user.createdBy !== undefined) {
			storage.setUserCreatedBy(response.user.createdBy || '')
		}
		if (response.user.subscription?.status) {
			storage.setSubscriptionStatus(response.user.subscription.status)
		}
		if (response.user.subscription?.plan?.name) {
			storage.setPlanName(response.user.subscription.plan.name)
		}
		// Sincroniza hasPendingCustomFields
		storage.setHasPendingCustomFields(response.user.hasPendingCustomFields ?? false)
	}

	return response.user
}

/**
 * Hook para buscar dados do usuário autenticado.
 *
 * Lógica:
 * 1. Só executa se tiver token no localStorage (enabled: isAuthenticated)
 * 2. Dados são buscados em background e sincronizados com localStorage
 * 3. Se token inválido, interceptor do axios faz logout automaticamente
 * 4. Componentes devem usar skeletons enquanto isLoading=true
 */
export const useUser = () => {
	const queryClient = useQueryClient()
	const isAuthenticated = storage.isAuthenticated()

	const {
		data: user,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: queryKeys.auth.me,
		queryFn: fetchUser,
		enabled: isAuthenticated,
		staleTime: 1000 * 60 * 5, // 5 minutos
		gcTime: 1000 * 60 * 10, // 10 minutos
		retry: false,
	})

	const invalidateUser = () => {
		queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
	}

	return {
		user: user ?? null,
		isLoading: isAuthenticated && isLoading,
		error,
		isAuthenticated,
		refetch,
		invalidateUser,
	}
}
