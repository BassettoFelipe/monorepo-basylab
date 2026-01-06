import { api } from '@/lib/api'
import type { CreatePropertyOwnerInput, PropertyOwner } from '@/types/property-owner.types'

interface CreatePropertyOwnerResponse {
	data: PropertyOwner
	message: string
}

export const createPropertyOwner = async (
	input: CreatePropertyOwnerInput,
): Promise<CreatePropertyOwnerResponse> => {
	const { data } = await api.post<CreatePropertyOwnerResponse>('/api/property-owners', input)
	return data
}
