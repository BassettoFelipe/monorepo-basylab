import { NotFoundError } from '@basylab/core/errors'
import Elysia, { t } from 'elysia'
import { TenantRepository, TicketRepository } from '../../repositories'
import { apiKeyMiddleware, authMiddleware } from '../middlewares'

// Rotas via API Key (para projetos)
export const ticketApiRoutes = new Elysia({ prefix: '/api/v1/tickets' })
	.use(apiKeyMiddleware)
	.get('/', async ({ tenant }) => {
		return TicketRepository.findByTenantId(tenant.id)
	})
	.get(
		'/:id',
		async ({ params, tenant }) => {
			const ticket = await TicketRepository.findById(params.id)

			if (!ticket || ticket.tenantId !== tenant.id) {
				throw new NotFoundError('Ticket não encontrado')
			}

			const messages = await TicketRepository.getMessages(params.id)

			return { ...ticket, messages }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.post(
		'/',
		async ({ body, tenant }) => {
			return TicketRepository.create({
				...body,
				tenantId: tenant.id,
			})
		},
		{
			body: t.Object({
				externalUserId: t.Optional(t.String()),
				externalUserEmail: t.Optional(t.String()),
				title: t.String({ minLength: 1, maxLength: 255 }),
				description: t.Optional(t.String()),
				priority: t.Optional(
					t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high'), t.Literal('urgent')]),
				),
				category: t.Optional(t.String()),
				metadata: t.Optional(t.Record(t.String(), t.Unknown())),
			}),
		},
	)
	.post(
		'/:id/messages',
		async ({ params, body, tenant }) => {
			const ticket = await TicketRepository.findById(params.id)

			if (!ticket || ticket.tenantId !== tenant.id) {
				throw new NotFoundError('Ticket não encontrado')
			}

			return TicketRepository.addMessage({
				ticketId: params.id,
				senderType: 'user',
				senderId: body.senderId,
				content: body.content,
				attachments: body.attachments,
			})
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				senderId: t.Optional(t.String()),
				content: t.String({ minLength: 1 }),
				attachments: t.Optional(t.Array(t.Unknown())),
			}),
		},
	)

// Rotas via Auth (para painel admin)
export const ticketAdminRoutes = new Elysia({ prefix: '/tickets' })
	.use(authMiddleware)
	.get('/', async ({ user }) => {
		if (user.role === 'owner') {
			return TicketRepository.findAll()
		}

		const tenants = await TenantRepository.findByManagerId(user.userId)
		const tenantIds = tenants.map((t) => t.id)

		return TicketRepository.findByTenantIds(tenantIds)
	})
	.get(
		'/:id',
		async ({ params, user }) => {
			const ticket = await TicketRepository.findById(params.id)

			if (!ticket) {
				throw new NotFoundError('Ticket não encontrado')
			}

			if (user.role !== 'owner') {
				const hasAccess = await TenantRepository.isManagerOfTenant(user.userId, ticket.tenantId)
				if (!hasAccess) {
					throw new NotFoundError('Ticket não encontrado')
				}
			}

			const messages = await TicketRepository.getMessages(params.id)

			return { ...ticket, messages }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.put(
		'/:id',
		async ({ params, body, user }) => {
			const ticket = await TicketRepository.findById(params.id)

			if (!ticket) {
				throw new NotFoundError('Ticket não encontrado')
			}

			if (user.role !== 'owner') {
				const hasAccess = await TenantRepository.isManagerOfTenant(user.userId, ticket.tenantId)
				if (!hasAccess) {
					throw new NotFoundError('Ticket não encontrado')
				}
			}

			const updateData: Record<string, unknown> = {}

			if (body.status) updateData.status = body.status
			if (body.priority) updateData.priority = body.priority
			if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo
			if (body.category !== undefined) updateData.category = body.category

			if (body.status === 'resolved' && ticket.status !== 'resolved') {
				updateData.resolvedAt = new Date()
			}

			return TicketRepository.update(params.id, updateData)
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				status: t.Optional(
					t.Union([
						t.Literal('open'),
						t.Literal('in_progress'),
						t.Literal('waiting'),
						t.Literal('resolved'),
						t.Literal('closed'),
					]),
				),
				priority: t.Optional(
					t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high'), t.Literal('urgent')]),
				),
				assignedTo: t.Optional(t.Union([t.String(), t.Null()])),
				category: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.post(
		'/:id/messages',
		async ({ params, body, user }) => {
			const ticket = await TicketRepository.findById(params.id)

			if (!ticket) {
				throw new NotFoundError('Ticket não encontrado')
			}

			if (user.role !== 'owner') {
				const hasAccess = await TenantRepository.isManagerOfTenant(user.userId, ticket.tenantId)
				if (!hasAccess) {
					throw new NotFoundError('Ticket não encontrado')
				}
			}

			return TicketRepository.addMessage({
				ticketId: params.id,
				senderType: user.role,
				senderId: user.userId,
				content: body.content,
				attachments: body.attachments,
			})
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				content: t.String({ minLength: 1 }),
				attachments: t.Optional(t.Array(t.Unknown())),
			}),
		},
	)
