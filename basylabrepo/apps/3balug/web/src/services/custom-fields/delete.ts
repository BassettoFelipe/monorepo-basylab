import { api } from '@/lib/api'

export interface DeleteCustomFieldResponse {
	success: boolean
	message: string
}

export async function deleteCustomField(fieldId: string): Promise<DeleteCustomFieldResponse> {
	const response = await api.delete<DeleteCustomFieldResponse>(`/custom-fields/${fieldId}`)
	return response.data
}
