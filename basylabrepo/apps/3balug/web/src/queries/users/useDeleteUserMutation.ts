import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { deleteUser } from '@/services/users/delete-user'
import type { ListUsersResponse } from '@/types/user.types'
import { queryKeys } from '../queryKeys'

export const useDeleteUserMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (userId: string) => deleteUser(userId),
		// Optimistic update
		onMutate: async (userId) => {
			// Cancela queries em andamento
			await queryClient.cancelQueries({ queryKey: queryKeys.users.all })

			// Snapshot do estado anterior
			const previousData = queryClient.getQueriesData({
				queryKey: queryKeys.users.all,
			})

			// Atualiza otimisticamente - remove o usuário da lista
			queryClient.setQueriesData<ListUsersResponse>({ queryKey: queryKeys.users.all }, (old) => {
				if (!old) return old
				return {
					...old,
					users: old.users.filter((user) => user.id !== userId),
					total: old.total - 1,
				}
			})

			return { previousData }
		},
		onSuccess: () => {
			toast.success('Usuário deletado permanentemente com sucesso!')
		},
		onError: (err: unknown, _userId, context) => {
			// Reverte em caso de erro
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
					: 'Erro ao deletar usuário'
			toast.error(errorMessage)
		},
		onSettled: () => {
			// Revalida após sucesso ou erro
			queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
		},
	})
}
