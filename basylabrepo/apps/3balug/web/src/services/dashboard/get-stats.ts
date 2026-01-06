import { api } from '@/lib/api'
import type { DashboardStats, GetDashboardStatsResponse } from '@/types/dashboard.types'

export async function getDashboardStats(): Promise<DashboardStats> {
	const { data } = await api.get<GetDashboardStatsResponse>('/api/dashboard/stats')
	return data.data
}
