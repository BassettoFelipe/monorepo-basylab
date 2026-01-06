import { api } from '@/lib/api'

export interface SetPrimaryPhotoResponse {
	success: boolean
	message: string
}

export interface SetPrimaryPhotoInput {
	propertyId: string
	photoId: string
}

export const setPrimaryPhoto = async (
	input: SetPrimaryPhotoInput,
): Promise<SetPrimaryPhotoResponse> => {
	const { data } = await api.patch<SetPrimaryPhotoResponse>(
		`/api/properties/${input.propertyId}/photos/${input.photoId}/primary`,
	)

	return data
}
