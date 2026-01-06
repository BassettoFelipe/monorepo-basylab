import type { Ticket } from '@/db/schema'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { ITicketRepository } from '@/repositories/contracts/ticket.repository'

type ListTicketsInput = {
	userRole: 'owner' | 'manager'
	userId: string
	tenantId?: string
	status?: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
	priority?: 'low' | 'medium' | 'high' | 'urgent'
	limit?: number
	offset?: number
}

type ListTicketsOutput = {
	data: Ticket[]
	total: number
	limit: number
	offset: number
}

export class ListTicketsUseCase {
	constructor(
		private readonly ticketRepository: ITicketRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: ListTicketsInput): Promise<ListTicketsOutput> {
		const { userRole, userId, tenantId, status, priority, limit = 20, offset = 0 } = input

		if (userRole === 'owner') {
			return await this.ticketRepository.list({
				tenantId,
				status,
				priority,
				limit,
				offset,
			})
		}

		// Manager só vê tickets dos tenants que gerencia
		const tenants = await this.tenantRepository.findByManagerId(userId)
		const tenantIds = tenants.map((t) => t.id)

		if (tenantIds.length === 0) {
			return { data: [], total: 0, limit, offset }
		}

		return await this.ticketRepository.list({
			tenantIds,
			status,
			priority,
			limit,
			offset,
		})
	}
}
