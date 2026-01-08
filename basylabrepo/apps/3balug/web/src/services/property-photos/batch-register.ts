import { api } from '@/lib/api'

export interface PropertyPhotoResponse {
	id: string
	url: string
	isPrimary: boolean
	order: number
	createdAt: string
}

export interface BatchRegisterPhotoItem {
	key: string
	originalName: string
	mimeType: string
	size: number
	url: string
	isPrimary?: boolean
}

export interface BatchRegisterPhotosInput {
	propertyId: string
	photos: BatchRegisterPhotoItem[]
}

export interface BatchRegisterPhotosResponse {
	success: boolean
	message: string
	data: {
		registered: number
		photos: PropertyPhotoResponse[]
	}
}

export const batchRegisterPropertyPhotos = async (
	input: BatchRegisterPhotosInput,
): Promise<BatchRegisterPhotosResponse> => {
	const { data } = await api.post<BatchRegisterPhotosResponse>(
		`/api/properties/${input.propertyId}/photos/batch`,
		{ photos: input.photos },
	)

	return data
}
