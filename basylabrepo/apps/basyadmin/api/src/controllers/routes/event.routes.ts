import Elysia, { t } from 'elysia'
import { EventRepository, TenantRepository } from '../../repositories'
import { apiKeyMiddleware, authMiddleware } from '../middlewares'

// Rotas via API Key (para projetos)
export const eventApiRoutes = new Elysia({ prefix: '/api/v1/events' })
	.use(apiKeyMiddleware)
	.post(
		'/',
		async ({ body, tenant }) => {
			return EventRepository.create({
				tenantId: tenant.id,
				eventName: body.eventName,
				userId: body.userId,
				properties: body.properties,
			})
		},
		{
			body: t.Object({
				eventName: t.String({ minLength: 1, maxLength: 100 }),
				userId: t.Optional(t.String()),
				properties: t.Optional(t.Record(t.String(), t.Unknown())),
			}),
		},
	)
	.post(
		'/batch',
		async ({ body, tenant }) => {
			const events = body.events.map((event) => ({
				tenantId: tenant.id,
				eventName: event.eventName,
				userId: event.userId,
				properties: event.properties,
			}))

			return EventRepository.createBatch(events)
		},
		{
			body: t.Object({
				events: t.Array(
					t.Object({
						eventName: t.String({ minLength: 1, maxLength: 100 }),
						userId: t.Optional(t.String()),
						properties: t.Optional(t.Record(t.String(), t.Unknown())),
					}),
				),
			}),
		},
	)

// Rotas via Auth (para painel admin)
export const eventAdminRoutes = new Elysia({ prefix: '/events' })
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
			} else if (user.role !== 'owner') {
				const tenants = await TenantRepository.findByManagerId(user.userId)
				if (tenants.length === 0) return []
				// For simplicity, just return first tenant's events
				filters.tenantId = tenants[0].id
			}

			if (query.eventName) filters.eventName = query.eventName
			if (query.userId) filters.userId = query.userId
			if (query.startDate) filters.startDate = new Date(query.startDate)
			if (query.endDate) filters.endDate = new Date(query.endDate)

			const limit = query.limit ? Number(query.limit) : 100
			const offset = query.offset ? Number(query.offset) : 0

			return EventRepository.findByFilters(filters, limit, offset)
		},
		{
			query: t.Object({
				tenantId: t.Optional(t.String()),
				eventName: t.Optional(t.String()),
				userId: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
				limit: t.Optional(t.String()),
				offset: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/aggregate',
		async ({ query, user }) => {
			if (!query.tenantId) {
				return []
			}

			if (user.role !== 'owner') {
				const hasAccess = await TenantRepository.isManagerOfTenant(user.userId, query.tenantId)
				if (!hasAccess) {
					return []
				}
			}

			const startDate = query.startDate ? new Date(query.startDate) : undefined
			const endDate = query.endDate ? new Date(query.endDate) : undefined

			return EventRepository.aggregate(query.tenantId, startDate, endDate)
		},
		{
			query: t.Object({
				tenantId: t.String(),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
			}),
		},
	)
