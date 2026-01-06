import { api } from '@/lib/api'

interface UploadWithPresignedUrlParams {
	file: File
	fieldId: string
	maxFileSize?: number
	allowedTypes?: string[]
}

interface PresignedUrlResponse {
	uploadUrl: string
	fileUrl: string
	key: string
}

export async function uploadWithPresignedUrl({
	file,
	fieldId,
}: UploadWithPresignedUrlParams): Promise<{
	url: string
	key: string
	fileName: string
	size: number
	contentType: string
}> {
	const { data } = await api.post<PresignedUrlResponse>('/files/presigned-url', {
		fileName: file.name,
		contentType: file.type,
		fieldId,
	})

	await fetch(data.uploadUrl, {
		method: 'PUT',
		body: file,
		headers: {
			'Content-Type': file.type,
		},
	})

	return {
		url: data.fileUrl,
		key: data.key,
		fileName: file.name,
		size: file.size,
		contentType: file.type,
	}
}
