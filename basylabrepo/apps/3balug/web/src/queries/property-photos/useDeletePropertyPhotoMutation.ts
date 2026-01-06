import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import {
	type DeletePropertyPhotoInput,
	type DeletePropertyPhotoResponse,
	deletePropertyPhoto,
} from '@/services/property-photos/delete'

export const useDeletePropertyPhotoMutation = () => {
	const queryClient = useQueryClient()

	return useMutation<DeletePropertyPhotoResponse, Error, DeletePropertyPhotoInput>({
		mutationFn: deletePropertyPhoto,
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.properties.detail(variables.propertyId),
				refetchType: 'active',
			})
		},
	})
}
