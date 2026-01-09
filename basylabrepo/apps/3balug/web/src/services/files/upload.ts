import { api } from '@/lib/api'

export type UploadEntityType = 'tenant' | 'property_owner' | 'property' | 'user'

interface UploadWithPresignedUrlParams {
	file: File
	entityType: UploadEntityType
	entityId: string
	fieldId?: string
	allowedTypes?: string[]
}

interface PresignedUrlData {
	uploadUrl: string
	publicUrl: string
	key: string
	expiresAt: string
}

interface PresignedUrlResponse {
	success: boolean
	message: string
	data: PresignedUrlData
}

export async function uploadWithPresignedUrl({
	file,
	entityType,
	entityId,
	fieldId,
}: UploadWithPresignedUrlParams): Promise<{
	url: string
	key: string
	fileName: string
	size: number
	contentType: string
}> {
	const { data: response } = await api.post<PresignedUrlResponse>('/api/files/presigned-url', {
		fileName: file.name,
		contentType: file.type,
		entityType,
		entityId,
		fieldId,
	})

	await fetch(response.data.uploadUrl, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type,
		},
	})

	return {
		url: response.data.publicUrl,
		key: response.data.key,
		fileName: file.name,
		size: file.size,
		contentType: file.type,
	}
}
