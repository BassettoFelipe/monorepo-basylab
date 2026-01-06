import { api } from '@/lib/api'
import type {
	ListTenantsApiResponse,
	ListTenantsParams,
	ListTenantsResponse,
} from '@/types/tenant.types'

export const listTenants = async (params?: ListTenantsParams): Promise<ListTenantsResponse> => {
	const limit = params?.limit ?? 20
	const page = params?.page ?? 1
	const offset = (page - 1) * limit

	const { data } = await api.get<{ success: boolean } & ListTenantsApiResponse>('/api/tenants', {
		params: {
			search: params?.search,
			limit,
			offset,
		},
	})

	const totalPages = Math.ceil(data.total / limit)

	return {
		data: data.data,
		total: data.total,
		page,
		limit,
		totalPages,
	}
}
