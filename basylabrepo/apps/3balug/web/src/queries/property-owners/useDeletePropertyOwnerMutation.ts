import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { deletePropertyOwner } from '@/services/property-owners/delete'
import type { ListPropertyOwnersResponse } from '@/types/property-owner.types'
import { queryKeys } from '../queryKeys'

export const useDeletePropertyOwnerMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => deletePropertyOwner(id),
		onMutate: async (id) => {
			await queryClient.cancelQueries({
				queryKey: queryKeys.propertyOwners.all,
			})

			const previousData = queryClient.getQueriesData({
				queryKey: queryKeys.propertyOwners.all,
			})

			queryClient.setQueriesData<ListPropertyOwnersResponse>(
				{ queryKey: queryKeys.propertyOwners.all },
				(old) => {
					if (!old) return old
					return {
						...old,
						data: old.data.filter((owner) => owner.id !== id),
						total: old.total - 1,
					}
				},
			)

			return { previousData }
		},
		onSuccess: () => {
			toast.success('Proprietário deletado com sucesso!')
		},
		onError: (err: unknown, _id, context) => {
			if (context?.previousData) {
				for (const [queryKey, data] of context.previousData) {
					queryClient.setQueryData(queryKey, data)
				}
			}
			const errorMessage =
				err &&
				typeof err === 'object' &&
				'response' in err &&
				err.response &&
				typeof err.response === 'object' &&
				'data' in err.response &&
				err.response.data &&
				typeof err.response.data === 'object' &&
				'message' in err.response.data
					? String(err.response.data.message)
					: 'Erro ao deletar proprietário'
			toast.error(errorMessage)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.propertyOwners.all })
		},
	})
}
