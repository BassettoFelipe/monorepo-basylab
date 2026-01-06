import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProperty } from '@/services/properties/update'
import type { UpdatePropertyInput } from '@/types/property.types'
import { queryKeys } from '../queryKeys'

interface UpdatePropertyMutationParams {
	id: string
	input: UpdatePropertyInput
}

export const useUpdatePropertyMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, input }: UpdatePropertyMutationParams) => updateProperty(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.properties.all })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats })
		},
	})
}
