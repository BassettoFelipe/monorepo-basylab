import { api } from '@/lib/api'
import type { CustomField } from '@/types/custom-field.types'

export interface CreateCustomFieldPayload {
	type: string
	label: string
	placeholder?: string
	helpText?: string
	isRequired: boolean
	options?: string[]
	fileConfig?: {
		maxFileSize?: number
		maxFiles?: number
		allowedTypes?: string[]
	}
}

export interface CreateCustomFieldResponse {
	success: boolean
	data: CustomField
	message: string
}

export async function createCustomField(
	payload: CreateCustomFieldPayload,
): Promise<CreateCustomFieldResponse> {
	const response = await api.post<CreateCustomFieldResponse>('/custom-fields', payload)
	return response.data
}
