import { BadRequestError, InternalServerError, NotFoundError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { TicketMessage } from '@/db/schema'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'
import type { ITicketRepository } from '@/repositories/contracts/ticket.repository'

const logger = createLogger({ service: 'add-ticket-message-use-case' })

type AddTicketMessageInput = {
	ticketId: string
	senderType: 'user' | 'manager' | 'owner' | 'system'
	senderId?: string
	content: string
	attachments?: unknown[]
	// Para validação de acesso
	userRole?: 'owner' | 'manager'
	userId?: string
	tenantId?: string // Se fornecido, valida que o ticket pertence ao tenant (para API routes)
}

type AddTicketMessageOutput = TicketMessage

export class AddTicketMessageUseCase {
	constructor(
		private readonly ticketRepository: ITicketRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: AddTicketMessageInput): Promise<AddTicketMessageOutput> {
		const { ticketId, senderType, senderId, content, attachments, userRole, userId, tenantId } =
			input

		if (!content || content.trim().length === 0) {
			throw new BadRequestError('Conteúdo é obrigatório')
		}

		const ticket = await this.ticketRepository.findById(ticketId)

		if (!ticket) {
			throw new NotFoundError('Ticket não encontrado')
		}

		// Se tenantId foi fornecido (API route), valida que pertence ao tenant
		if (tenantId && ticket.tenantId !== tenantId) {
			throw new NotFoundError('Ticket não encontrado')
		}

		// Se temos userRole/userId (admin route), verifica acesso
		if (userRole && userId && !tenantId) {
			if (userRole !== 'owner') {
				const hasAccess = await this.tenantRepository.isManagerOfTenant(userId, ticket.tenantId)
				if (!hasAccess) {
					throw new NotFoundError('Ticket não encontrado')
				}
			}
		}

		try {
			const message = await this.ticketRepository.addMessage({
				ticketId,
				senderType,
				senderId: senderId || null,
				content: content.trim(),
				attachments: attachments || [],
			})

			logger.info({ messageId: message.id, ticketId }, 'Mensagem adicionada ao ticket')

			return message
		} catch (error) {
			if (error instanceof BadRequestError || error instanceof NotFoundError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao adicionar mensagem ao ticket')
			throw new InternalServerError('Erro ao adicionar mensagem. Tente novamente.')
		}
	}
}
