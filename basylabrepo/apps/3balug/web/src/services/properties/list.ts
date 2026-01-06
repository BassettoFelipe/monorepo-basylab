import { api } from '@/lib/api'
import type {
	ListPropertiesApiResponse,
	ListPropertiesParams,
	ListPropertiesResponse,
} from '@/types/property.types'

export const listProperties = async (
	params?: ListPropertiesParams,
): Promise<ListPropertiesResponse> => {
	const limit = params?.limit ?? 20
	const page = params?.page ?? 1
	const offset = (page - 1) * limit

	const { data } = await api.get<{ success: boolean } & ListPropertiesApiResponse>(
		'/api/properties',
		{
			params: {
				search: params?.search,
				type: params?.type,
				listingType: params?.listingType,
				status: params?.status,
				city: params?.city,
				minRentalPrice: params?.minRentalPrice,
				maxRentalPrice: params?.maxRentalPrice,
				minSalePrice: params?.minSalePrice,
				maxSalePrice: params?.maxSalePrice,
				minBedrooms: params?.minBedrooms,
				maxBedrooms: params?.maxBedrooms,
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
