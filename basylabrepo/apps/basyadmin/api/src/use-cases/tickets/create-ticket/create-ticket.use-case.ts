import { BadRequestError, InternalServerError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Ticket } from '@/db/schema'
import type { ITicketRepository } from '@/repositories/contracts/ticket.repository'

const logger = createLogger({ service: 'create-ticket-use-case' })

type CreateTicketInput = {
	tenantId: string
	externalUserId?: string
	externalUserEmail?: string
	title: string
	description?: string
	priority?: 'low' | 'medium' | 'high' | 'urgent'
	category?: string
	metadata?: Record<string, unknown>
}

type CreateTicketOutput = Ticket

export class CreateTicketUseCase {
	constructor(private readonly ticketRepository: ITicketRepository) {}

	async execute(input: CreateTicketInput): Promise<CreateTicketOutput> {
		const {
			tenantId,
			externalUserId,
			externalUserEmail,
			title,
			description,
			priority,
			category,
			metadata,
		} = input

		if (!title || title.trim().length === 0) {
			throw new BadRequestError('Título é obrigatório')
		}

		try {
			const ticket = await this.ticketRepository.create({
				tenantId,
				externalUserId: externalUserId?.trim() || null,
				externalUserEmail: externalUserEmail?.toLowerCase().trim() || null,
				title: title.trim(),
				description: description?.trim() || null,
				priority: priority || 'medium',
				category: category?.trim() || null,
				metadata: metadata || {},
			})

			logger.info({ ticketId: ticket.id, tenantId }, 'Ticket criado com sucesso')

			return ticket
		} catch (error) {
			if (error instanceof BadRequestError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar ticket')
			throw new InternalServerError('Erro ao criar ticket. Tente novamente.')
		}
	}
}
