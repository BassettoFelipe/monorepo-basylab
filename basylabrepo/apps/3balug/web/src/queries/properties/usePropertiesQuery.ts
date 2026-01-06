import { useQuery } from '@tanstack/react-query'
import { listProperties } from '@/services/properties/list'
import type { ListPropertiesParams, ListPropertiesResponse } from '@/types/property.types'
import { queryKeys } from '../queryKeys'

export const usePropertiesQuery = (params?: ListPropertiesParams) => {
	return useQuery<ListPropertiesResponse>({
		queryKey: queryKeys.properties.list(params),
		queryFn: () => listProperties(params),
		staleTime: 0,
		gcTime: 1000 * 60 * 5,
	})
}
