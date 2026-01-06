import Elysia, { t } from 'elysia'
import { BillingRepository, TenantRepository } from '../../repositories'
import { apiKeyMiddleware, authMiddleware } from '../middlewares'

// Rotas via API Key (webhook de projetos)
export const billingApiRoutes = new Elysia({ prefix: '/api/v1/billing' })
	.use(apiKeyMiddleware)
	.post(
		'/webhook',
		async ({ body, tenant }) => {
			return BillingRepository.create({
				tenantId: tenant.id,
				externalCustomerId: body.customerId,
				customerEmail: body.customerEmail,
				planSlug: body.planSlug,
				amountCents: body.amountCents,
				currency: body.currency || 'BRL',
				status: body.status,
				paidAt: body.status === 'paid' ? new Date() : null,
				metadata: body.metadata,
			})
		},
		{
			body: t.Object({
				customerId: t.Optional(t.String()),
				customerEmail: t.Optional(t.String()),
				planSlug: t.Optional(t.String()),
				amountCents: t.Number(),
				currency: t.Optional(t.String()),
				status: t.Union([
					t.Literal('paid'),
					t.Literal('pending'),
					t.Literal('failed'),
					t.Literal('refunded'),
				]),
				metadata: t.Optional(t.Record(t.String(), t.Unknown())),
			}),
		},
	)

// Rotas via Auth (para painel admin)
export const billingAdminRoutes = new Elysia({ prefix: '/billing' })
	.use(authMiddleware)
	.get(
		'/',
		async ({ query, user }) => {
			const filters: Record<string, unknown> = {}

			if (query.tenantId) {
				if (user.role !== 'owner') {
					const hasAccess = await TenantRepository.isManagerOfTenant(user.userId, query.tenantId)
					if (!hasAccess) {
						return []
					}
				}
				filters.tenantId = query.tenantId
			}

			if (query.status) filters.status = query.status
			if (query.startDate) filters.startDate = new Date(query.startDate)
			if (query.endDate) filters.endDate = new Date(query.endDate)

			const limit = query.limit ? Number(query.limit) : 100
			const offset = query.offset ? Number(query.offset) : 0

			return BillingRepository.findByFilters(filters, limit, offset)
		},
		{
			query: t.Object({
				tenantId: t.Optional(t.String()),
				status: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
				limit: t.Optional(t.String()),
				offset: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/stats',
		async ({ query, user }) => {
			let tenantId: string | undefined

			if (query.tenantId) {
				if (user.role !== 'owner') {
					const hasAccess = await TenantRepository.isManagerOfTenant(user.userId, query.tenantId)
					if (!hasAccess) {
						return {
							totalRevenue: 0,
							totalTransactions: 0,
							paidTransactions: 0,
							failedTransactions: 0,
						}
					}
				}
				tenantId = query.tenantId
			}

			const startDate = query.startDate ? new Date(query.startDate) : undefined
			const endDate = query.endDate ? new Date(query.endDate) : undefined

			const stats = await BillingRepository.getStats(tenantId, startDate, endDate)
			const mrr = await BillingRepository.getMRR(tenantId)

			return {
				...stats,
				mrr,
				arr: mrr * 12,
			}
		},
		{
			query: t.Object({
				tenantId: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
			}),
		},
	)
