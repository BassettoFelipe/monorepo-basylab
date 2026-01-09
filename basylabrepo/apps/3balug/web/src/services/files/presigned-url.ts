import { api } from '@/lib/api'
import type { UploadEntityType } from './upload'

export interface PresignedUrlInput {
	fileName: string
	contentType: string
	entityType: UploadEntityType
	entityId: string
	fieldId?: string
	allowedTypes?: string[]
}

export interface PresignedUrlResponse {
	success: boolean
	message: string
	data: {
		uploadUrl: string
		key: string
		publicUrl: string
		expiresAt: string
	}
}

export const getPresignedUrl = async (input: PresignedUrlInput): Promise<PresignedUrlResponse> => {
	const { data } = await api.post<PresignedUrlResponse>('/api/files/presigned-url', input)
	return data
}

export const uploadToPresignedUrl = async (uploadUrl: string, file: File): Promise<void> => {
	await fetch(uploadUrl, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type,
		},
	})
}
