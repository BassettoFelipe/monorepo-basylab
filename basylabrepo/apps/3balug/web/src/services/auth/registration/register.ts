import { api } from '@/lib/api'
import type { RegisterData, RegisterResponse } from '@/types/auth.types'

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
	const { data: response } = await api.post<RegisterResponse>('/auth/register', data)
	return response
}
