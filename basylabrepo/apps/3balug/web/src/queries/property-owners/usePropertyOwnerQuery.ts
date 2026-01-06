import { useQuery } from '@tanstack/react-query'
import { getPropertyOwner } from '@/services/property-owners/get'
import type { PropertyOwner } from '@/types/property-owner.types'
import { queryKeys } from '../queryKeys'

interface UsePropertyOwnerQueryOptions {
	enabled?: boolean
}

export const usePropertyOwnerQuery = (
	id: string | undefined,
	options?: UsePropertyOwnerQueryOptions,
) => {
	return useQuery<PropertyOwner>({
		queryKey: queryKeys.propertyOwners.detail(id ?? ''),
		queryFn: () => getPropertyOwner(id as string),
		enabled: !!id && (options?.enabled ?? true),
		staleTime: 0,
		gcTime: 1000 * 60 * 5,
	})
}
