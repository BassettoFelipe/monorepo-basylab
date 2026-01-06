import { useQuery } from '@tanstack/react-query'
import { getProperty } from '@/services/properties/get'
import type { Property } from '@/types/property.types'
import { queryKeys } from '../queryKeys'

interface UsePropertyQueryOptions {
	enabled?: boolean
}

export const usePropertyQuery = (id: string | undefined, options?: UsePropertyQueryOptions) => {
	return useQuery<Property>({
		queryKey: queryKeys.properties.detail(id ?? ''),
		queryFn: () => getProperty(id as string),
		enabled: !!id && (options?.enabled ?? true),
		staleTime: 0,
		gcTime: 1000 * 60 * 5,
	})
}
