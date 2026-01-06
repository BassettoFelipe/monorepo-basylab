import { t } from 'elysia'

export const billingStatsQuerySchema = t.Object({
	tenantId: t.Optional(t.String()),
	startDate: t.Optional(t.String()),
	endDate: t.Optional(t.String()),
})

export const billingStatsResponseSchema = t.Object({
	success: t.Boolean(),
	data: t.Object({
		totalRevenue: t.Number(),
		totalTransactions: t.Number(),
		paidTransactions: t.Number(),
		failedTransactions: t.Number(),
		mrr: t.Number(),
		arr: t.Number(),
	}),
})
