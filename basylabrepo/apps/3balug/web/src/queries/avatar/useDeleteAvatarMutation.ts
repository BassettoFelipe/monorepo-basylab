import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/queries/queryKeys'
import type { User } from '@/types/user.types'

interface DeleteAvatarResponse {
	success: boolean
	message: string
}

async function deleteAvatar(): Promise<DeleteAvatarResponse> {
	const response = await api.delete<DeleteAvatarResponse>('/avatar')
	return response.data
}

export function useDeleteAvatarMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteAvatar,
		onSuccess: () => {
			queryClient.setQueryData<User>(queryKeys.auth.me, (old) =>
				old ? { ...old, avatarUrl: null } : old,
			)
		},
		onError: () => {
			alert('Erro ao remover foto. Tente novamente.')
		},
	})
}
