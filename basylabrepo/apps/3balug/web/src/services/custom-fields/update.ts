import { api } from '@/lib/api'
import type { CustomField } from '@/types/custom-field.types'

export interface UpdateCustomFieldPayload {
	label?: string
	placeholder?: string
	helpText?: string
	isRequired?: boolean
	isActive?: boolean
	options?: string[]
	fileConfig?: {
		maxFileSize?: number
		maxFiles?: number
		allowedTypes?: string[]
	}
}

export interface UpdateCustomFieldResponse {
	success: boolean
	data: CustomField
	message: string
}

export async function updateCustomField(
	fieldId: string,
	payload: UpdateCustomFieldPayload,
): Promise<UpdateCustomFieldResponse> {
	const response = await api.put<UpdateCustomFieldResponse>(`/custom-fields/${fieldId}`, payload)
	return response.data
}
