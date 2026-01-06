import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/queries/queryKeys'
import type { ListCustomFieldsResponse } from '@/types/custom-field.types'

interface UseCustomFieldsQueryOptions {
	includeInactive?: boolean
}

async function fetchCustomFields(includeInactive = false): Promise<ListCustomFieldsResponse> {
	const params = includeInactive ? { includeInactive: 'true' } : {}
	const response = await api.get<ListCustomFieldsResponse>('/custom-fields', {
		params,
	})
	return response.data
}

export function useCustomFieldsQuery(options?: UseCustomFieldsQueryOptions) {
	const includeInactive = options?.includeInactive ?? false

	return useQuery({
		queryKey: [...queryKeys.customFields.list, { includeInactive }],
		queryFn: () => fetchCustomFields(includeInactive),
		staleTime: 1000 * 60 * 5, // 5 minutos
	})
}
