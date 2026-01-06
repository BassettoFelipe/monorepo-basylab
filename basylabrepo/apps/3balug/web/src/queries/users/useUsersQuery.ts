import { useQuery } from '@tanstack/react-query'
import { listUsers } from '@/services/users/list-users'
import type { ListUsersParams, ListUsersResponse } from '@/types/user.types'
import { queryKeys } from '../queryKeys'

export const useUsersQuery = (params?: ListUsersParams) => {
	return useQuery<ListUsersResponse>({
		queryKey: queryKeys.users.list(params),
		queryFn: () => listUsers(params),
		staleTime: 0, // Sempre considera dados stale para refetch imediato
		gcTime: 1000 * 60 * 5, // 5 minutos
	})
}
