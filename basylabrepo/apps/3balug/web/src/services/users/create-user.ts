import { api } from '@/lib/api'
import type { CreateUserInput, TeamUser } from '@/types/user.types'

interface CreateUserResponse {
	data: TeamUser
	message: string
}

export const createUser = async (input: CreateUserInput): Promise<CreateUserResponse> => {
	const { data } = await api.post<CreateUserResponse>('/api/users', input)
	return data
}
