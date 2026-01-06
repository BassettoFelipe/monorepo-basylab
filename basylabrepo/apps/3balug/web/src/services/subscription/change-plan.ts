import { api } from '@/lib/api'

export interface ChangePlanResponse {
	success: true
	message: string
	subscription: {
		id: string
		planId: string
		plan: {
			id: string
			name: string
			price: number
		}
	}
}

export interface ChangePlanData {
	planId: string
}

export const changePlan = async (data: ChangePlanData): Promise<ChangePlanResponse> => {
	const { data: response } = await api.patch<ChangePlanResponse>('/subscriptions/change-plan', data)
	return response
}
