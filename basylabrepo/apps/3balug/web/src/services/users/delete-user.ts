import { api } from '@/lib/api'

interface DeleteUserResponse {
	data: {
		id: string
		email: string
		name: string
	}
	message: string
}

export const deleteUser = async (userId: string): Promise<DeleteUserResponse> => {
	const { data } = await api.delete<DeleteUserResponse>(`/api/users/${userId}/permanent`)
	return data
}
