import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { type BillingRecord, billingRecords, type NewBillingRecord } from '../db/schema'

export type BillingFilters = {
	tenantId?: string
	status?: 'paid' | 'pending' | 'failed' | 'refunded'
	startDate?: Date
	endDate?: Date
}

export type BillingStats = {
	totalRevenue: number
	totalTransactions: number
	paidTransactions: number
	failedTransactions: number
}

export const BillingRepository = {
	async findById(id: string): Promise<BillingRecord | undefined> {
		return db.query.billingRecords.findFirst({
			where: eq(billingRecords.id, id),
		})
	},

	async findByFilters(filters: BillingFilters, limit = 100, offset = 0): Promise<BillingRecord[]> {
		const conditions = []

		if (filters.tenantId) {
			conditions.push(eq(billingRecords.tenantId, filters.tenantId))
		}
		if (filters.status) {
			conditions.push(eq(billingRecords.status, filters.status))
		}
		if (filters.startDate) {
			conditions.push(gte(billingRecords.createdAt, filters.startDate))
		}
		if (filters.endDate) {
			conditions.push(lte(billingRecords.createdAt, filters.endDate))
		}

		return db.query.billingRecords.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			orderBy: [desc(billingRecords.createdAt)],
			limit,
			offset,
		})
	},

	async create(data: NewBillingRecord): Promise<BillingRecord> {
		const [record] = await db.insert(billingRecords).values(data).returning()
		return record
	},

	async update(id: string, data: Partial<NewBillingRecord>): Promise<BillingRecord> {
		const [record] = await db
			.update(billingRecords)
			.set(data)
			.where(eq(billingRecords.id, id))
			.returning()
		return record
	},

	async getStats(tenantId?: string, startDate?: Date, endDate?: Date): Promise<BillingStats> {
		const conditions = []

		if (tenantId) {
			conditions.push(eq(billingRecords.tenantId, tenantId))
		}
		if (startDate) {
			conditions.push(gte(billingRecords.createdAt, startDate))
		}
		if (endDate) {
			conditions.push(lte(billingRecords.createdAt, endDate))
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined

		const [totals] = await db
			.select({
				totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${billingRecords.status} = 'paid' THEN ${billingRecords.amountCents} ELSE 0 END), 0)`,
				totalTransactions: count(),
				paidTransactions: sql<number>`COUNT(CASE WHEN ${billingRecords.status} = 'paid' THEN 1 END)`,
				failedTransactions: sql<number>`COUNT(CASE WHEN ${billingRecords.status} = 'failed' THEN 1 END)`,
			})
			.from(billingRecords)
			.where(whereClause)

		return {
			totalRevenue: Number(totals.totalRevenue),
			totalTransactions: Number(totals.totalTransactions),
			paidTransactions: Number(totals.paidTransactions),
			failedTransactions: Number(totals.failedTransactions),
		}
	},

	async getMRR(tenantId?: string): Promise<number> {
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		const conditions = [
			eq(billingRecords.status, 'paid'),
			gte(billingRecords.paidAt, thirtyDaysAgo),
		]

		if (tenantId) {
			conditions.push(eq(billingRecords.tenantId, tenantId))
		}

		const [result] = await db
			.select({
				mrr: sql<number>`COALESCE(SUM(${billingRecords.amountCents}), 0)`,
			})
			.from(billingRecords)
			.where(and(...conditions))

		return Number(result.mrr)
	},
}
