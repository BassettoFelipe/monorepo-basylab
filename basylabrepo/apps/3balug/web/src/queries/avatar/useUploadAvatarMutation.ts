import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/queries/queryKeys'
import type { User } from '@/types/user.types'

interface UploadAvatarResponse {
	success: boolean
	message: string
	data: {
		avatarUrl: string
	}
}

async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
	const formData = new FormData()
	formData.append('file', file)

	const response = await api.post<UploadAvatarResponse>('/avatar', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	})

	return response.data
}

export function useUploadAvatarMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: uploadAvatar,
		onSuccess: (data) => {
			queryClient.setQueryData<User>(queryKeys.auth.me, (old) =>
				old ? { ...old, avatarUrl: data.data.avatarUrl } : old,
			)
		},
		onError: () => {
			alert('Erro ao atualizar foto. Tente novamente.')
		},
	})
}
