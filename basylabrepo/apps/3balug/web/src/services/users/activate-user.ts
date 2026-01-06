import { api } from '@/lib/api'
import type { TeamUser } from '@/types/user.types'

interface ActivateUserResponse {
	data: TeamUser
	message: string
}

export const activateUser = async (userId: string): Promise<ActivateUserResponse> => {
	const { data } = await api.patch<ActivateUserResponse>(`/api/users/${userId}/activate`)
	return data
}
