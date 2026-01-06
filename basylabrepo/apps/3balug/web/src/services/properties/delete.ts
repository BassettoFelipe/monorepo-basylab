import { api } from '@/lib/api'

interface DeletePropertyResponse {
	message: string
}

export const deleteProperty = async (id: string): Promise<DeletePropertyResponse> => {
	const { data } = await api.delete<DeletePropertyResponse>(`/api/properties/${id}`)
	return data
}
