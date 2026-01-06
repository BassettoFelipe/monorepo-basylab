import { useQuery } from '@tanstack/react-query'
import { getTenant } from '@/services/tenants/get'
import type { Tenant } from '@/types/tenant.types'
import { queryKeys } from '../queryKeys'

interface UseTenantQueryOptions {
	enabled?: boolean
}

export const useTenantQuery = (id: string | undefined, options?: UseTenantQueryOptions) => {
	return useQuery<Tenant>({
		queryKey: queryKeys.tenants.detail(id ?? ''),
		queryFn: () => getTenant(id as string),
		enabled: !!id && (options?.enabled ?? true),
		staleTime: 0,
		gcTime: 1000 * 60 * 5,
	})
}
