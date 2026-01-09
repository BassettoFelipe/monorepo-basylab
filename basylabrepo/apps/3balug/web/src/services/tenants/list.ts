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
			search: params?.search || undefined,
			state: params?.state || undefined,
			city: params?.city || undefined,
			hasEmail: params?.hasEmail !== undefined ? String(params.hasEmail) : undefined,
			hasPhone: params?.hasPhone !== undefined ? String(params.hasPhone) : undefined,
			minIncome: params?.minIncome || undefined,
			maxIncome: params?.maxIncome || undefined,
			maritalStatus: params?.maritalStatus || undefined,
			createdAtStart: params?.createdAtStart || undefined,
			createdAtEnd: params?.createdAtEnd || undefined,
			sortBy: params?.sortBy || undefined,
			sortOrder: params?.sortOrder || undefined,
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
