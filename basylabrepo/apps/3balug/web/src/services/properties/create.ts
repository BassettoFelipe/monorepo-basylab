import { api } from '@/lib/api'
import type { CreatePropertyInput, Property } from '@/types/property.types'

interface CreatePropertyResponse {
	data: Property
	message: string
}

export const createProperty = async (
	input: CreatePropertyInput,
): Promise<CreatePropertyResponse> => {
	const { data } = await api.post<CreatePropertyResponse>('/api/properties', input)
	return data
}
