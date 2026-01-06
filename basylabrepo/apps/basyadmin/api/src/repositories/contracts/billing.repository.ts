import type { BillingRecord, NewBillingRecord } from '@/db/schema'

export type BillingFilters = {
	tenantId?: string
	status?: 'paid' | 'pending' | 'failed' | 'refunded'
	startDate?: Date
	endDate?: Date
	limit?: number
	offset?: number
}

export type BillingListResult = {
	data: BillingRecord[]
	total: number
	limit: number
	offset: number
}

export type BillingStats = {
	totalRevenue: number
	totalTransactions: number
	paidTransactions: number
	failedTransactions: number
}

export interface IBillingRepository {
	findById(id: string): Promise<BillingRecord | null>
	findByFilters(filters: BillingFilters): Promise<BillingListResult>
	create(data: NewBillingRecord): Promise<BillingRecord>
	update(id: string, data: Partial<NewBillingRecord>): Promise<BillingRecord | null>
	getStats(tenantId?: string, startDate?: Date, endDate?: Date): Promise<BillingStats>
	getMRR(tenantId?: string): Promise<number>
}
