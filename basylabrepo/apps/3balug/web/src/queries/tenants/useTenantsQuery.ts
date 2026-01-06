import { useQuery } from '@tanstack/react-query'
import { listTenants } from '@/services/tenants/list'
import type { ListTenantsParams, ListTenantsResponse } from '@/types/tenant.types'
import { queryKeys } from '../queryKeys'

export const useTenantsQuery = (params?: ListTenantsParams) => {
	return useQuery<ListTenantsResponse>({
		queryKey: queryKeys.tenants.list(params),
		queryFn: () => listTenants(params),
		staleTime: 0,
		gcTime: 1000 * 60 * 5,
	})
}
