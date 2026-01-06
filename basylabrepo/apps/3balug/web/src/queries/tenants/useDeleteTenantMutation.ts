import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { deleteTenant } from '@/services/tenants/delete'
import type { ListTenantsResponse } from '@/types/tenant.types'
import { queryKeys } from '../queryKeys'

export const useDeleteTenantMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: string) => deleteTenant(id),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.tenants.all })

			const previousData = queryClient.getQueriesData({
				queryKey: queryKeys.tenants.all,
			})

			queryClient.setQueriesData<ListTenantsResponse>(
				{ queryKey: queryKeys.tenants.all },
				(old) => {
					if (!old) return old
					return {
						...old,
						data: old.data.filter((tenant) => tenant.id !== id),
						total: old.total - 1,
					}
				},
			)

			return { previousData }
		},
		onSuccess: () => {
			toast.success('Inquilino deletado com sucesso!')
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
					: 'Erro ao deletar inquilino'
			toast.error(errorMessage)
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all })
		},
	})
}
