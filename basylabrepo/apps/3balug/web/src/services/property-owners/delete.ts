import { api } from '@/lib/api'
import type { PropertyOwner } from '@/types/property-owner.types'

interface DeletePropertyOwnerResponse {
	data: PropertyOwner
	message: string
}

export const deletePropertyOwner = async (id: string): Promise<DeletePropertyOwnerResponse> => {
	const { data } = await api.delete<DeletePropertyOwnerResponse>(`/api/property-owners/${id}`)
	return data
}
