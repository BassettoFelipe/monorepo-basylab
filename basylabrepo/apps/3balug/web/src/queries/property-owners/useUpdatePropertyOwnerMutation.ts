import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePropertyOwner } from '@/services/property-owners/update'
import type { UpdatePropertyOwnerInput } from '@/types/property-owner.types'
import { queryKeys } from '../queryKeys'

interface UpdatePropertyOwnerMutationParams {
	id: string
	input: UpdatePropertyOwnerInput
}

export const useUpdatePropertyOwnerMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, input }: UpdatePropertyOwnerMutationParams) =>
			updatePropertyOwner(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.propertyOwners.all })
		},
	})
}
