import { api } from '@/lib/api'
import type { Property } from '@/types/property.types'

interface GetPropertyResponse {
	data: Property
}

export const getProperty = async (id: string): Promise<Property> => {
	const { data } = await api.get<GetPropertyResponse>(`/api/properties/${id}`)
	return data.data
}
