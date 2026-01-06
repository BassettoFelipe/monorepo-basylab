import { api } from '@/lib/api'
import type { TeamUser } from '@/types/user.types'

interface DeactivateUserResponse {
	data: TeamUser
	message: string
}

export const deactivateUser = async (userId: string): Promise<DeactivateUserResponse> => {
	const { data } = await api.delete<DeactivateUserResponse>(`/api/users/${userId}`)
	return data
}
