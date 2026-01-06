import { InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Ticket } from '@/db/schema'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { ITicketRepository } from '@/repositories/contracts/ticket.repository'

const logger = createLogger({ service: 'update-ticket-use-case' })

type UpdateTicketInput = {
	ticketId: string
	userRole: 'owner' | 'manager'
	userId: string
	status?: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
	priority?: 'low' | 'medium' | 'high' | 'urgent'
	assignedTo?: string | null
	category?: string | null
}

type UpdateTicketOutput = Ticket

export class UpdateTicketUseCase {
	constructor(
		private readonly ticketRepository: ITicketRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: UpdateTicketInput): Promise<UpdateTicketOutput> {
		const { ticketId, userRole, userId, status, priority, assignedTo, category } = input

		const ticket = await this.ticketRepository.findById(ticketId)

		if (!ticket) {
			throw new NotFoundError('Ticket não encontrado')
		}

		if (userRole !== 'owner') {
			const hasAccess = await this.tenantRepository.isManagerOfTenant(userId, ticket.tenantId)
			if (!hasAccess) {
				throw new NotFoundError('Ticket não encontrado')
			}
		}

		try {
			const updateData: Record<string, unknown> = {}

			if (status !== undefined) updateData.status = status
			if (priority !== undefined) updateData.priority = priority
			if (assignedTo !== undefined) updateData.assignedTo = assignedTo
			if (category !== undefined) updateData.category = category

			// Marca resolvedAt quando muda para resolved
			if (status === 'resolved' && ticket.status !== 'resolved') {
				updateData.resolvedAt = new Date()
			}

			const updatedTicket = await this.ticketRepository.update(ticketId, updateData)

			if (!updatedTicket) {
				throw new NotFoundError('Ticket não encontrado')
			}

			logger.info({ ticketId: updatedTicket.id }, 'Ticket atualizado com sucesso')

			return updatedTicket
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao atualizar ticket')
			throw new InternalServerError('Erro ao atualizar ticket. Tente novamente.')
		}
	}
}
