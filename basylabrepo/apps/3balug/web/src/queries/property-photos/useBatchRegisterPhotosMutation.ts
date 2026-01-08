import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import {
	type BatchRegisterPhotosInput,
	type BatchRegisterPhotosResponse,
	batchRegisterPropertyPhotos,
} from '@/services/property-photos/batch-register'

export const useBatchRegisterPhotosMutation = () => {
	const queryClient = useQueryClient()

	return useMutation<BatchRegisterPhotosResponse, Error, BatchRegisterPhotosInput>({
		mutationFn: batchRegisterPropertyPhotos,
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.properties.detail(variables.propertyId),
				refetchType: 'active',
			})
		},
	})
}
