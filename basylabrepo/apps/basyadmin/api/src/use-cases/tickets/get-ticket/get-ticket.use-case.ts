import { NotFoundError } from '@basylab/core/errors'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type {
	ITicketRepository,
	TicketWithMessages,
} from '@/repositories/contracts/ticket.repository'

type GetTicketInput = {
	ticketId: string
	userRole: 'owner' | 'manager'
	userId: string
	tenantId?: string // Se fornecido, valida que o ticket pertence ao tenant (para API routes)
}

type GetTicketOutput = TicketWithMessages

export class GetTicketUseCase {
	constructor(
		private readonly ticketRepository: ITicketRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: GetTicketInput): Promise<GetTicketOutput> {
		const { ticketId, userRole, userId, tenantId } = input

		const ticket = await this.ticketRepository.findByIdWithMessages(ticketId)

		if (!ticket) {
			throw new NotFoundError('Ticket não encontrado')
		}

		// Se tenantId foi fornecido (API route), valida que pertence ao tenant
		if (tenantId && ticket.tenantId !== tenantId) {
			throw new NotFoundError('Ticket não encontrado')
		}

		// Se não é owner, verifica se é manager do tenant
		if (userRole !== 'owner' && !tenantId) {
			const hasAccess = await this.tenantRepository.isManagerOfTenant(userId, ticket.tenantId)
			if (!hasAccess) {
				throw new NotFoundError('Ticket não encontrado')
			}
		}

		return ticket
	}
}
