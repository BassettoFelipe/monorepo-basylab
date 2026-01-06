import { api } from '@/lib/api'

export interface DeletePropertyPhotoResponse {
	success: boolean
	message: string
}

export interface DeletePropertyPhotoInput {
	propertyId: string
	photoId: string
}

export const deletePropertyPhoto = async (
	input: DeletePropertyPhotoInput,
): Promise<DeletePropertyPhotoResponse> => {
	const { data } = await api.delete<DeletePropertyPhotoResponse>(
		`/api/properties/${input.propertyId}/photos/${input.photoId}`,
	)

	return data
}
