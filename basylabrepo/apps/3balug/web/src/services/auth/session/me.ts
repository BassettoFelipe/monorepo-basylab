import { api } from '@/lib/api'
import type { MeResponse } from '@/types/auth.types'

export const me = async (): Promise<MeResponse> => {
	const { data } = await api.get<MeResponse>('/auth/me')
	return data
}
