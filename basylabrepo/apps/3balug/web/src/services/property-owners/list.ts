import { api } from '@/lib/api'
import type {
	ListPropertyOwnersApiResponse,
	ListPropertyOwnersParams,
	ListPropertyOwnersResponse,
} from '@/types/property-owner.types'

export const listPropertyOwners = async (
	params?: ListPropertyOwnersParams,
): Promise<ListPropertyOwnersResponse> => {
	const limit = params?.limit ?? 20
	const page = params?.page ?? 1
	const offset = (page - 1) * limit

	const { data } = await api.get<{ success: boolean } & ListPropertyOwnersApiResponse>(
		'/api/property-owners',
		{
			params: {
				search: params?.search || undefined,
				documentType: params?.documentType || undefined,
				state: params?.state || undefined,
				city: params?.city || undefined,
				hasProperties:
					params?.hasProperties !== undefined ? String(params.hasProperties) : undefined,
				hasEmail: params?.hasEmail !== undefined ? String(params.hasEmail) : undefined,
				hasPhone: params?.hasPhone !== undefined ? String(params.hasPhone) : undefined,
				createdAtStart: params?.createdAtStart || undefined,
				createdAtEnd: params?.createdAtEnd || undefined,
				sortBy: params?.sortBy || undefined,
				sortOrder: params?.sortOrder || undefined,
				limit,
				offset,
			},
		},
	)

	const totalPages = Math.ceil(data.total / limit)

	return {
		data: data.data,
		total: data.total,
		page,
		limit,
		totalPages,
	}
}
