import { BadRequestError, InternalServerError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Event } from '@/db/schema'
import type { IEventRepository } from '@/repositories/contracts/event.repository'

const logger = createLogger({ service: 'create-event-use-case' })

type CreateEventInput = {
	tenantId: string
	eventName: string
	userId?: string
	properties?: Record<string, unknown>
}

type CreateEventOutput = Event

export class CreateEventUseCase {
	constructor(private readonly eventRepository: IEventRepository) {}

	async execute(input: CreateEventInput): Promise<CreateEventOutput> {
		const { tenantId, eventName, userId, properties } = input

		if (!eventName || eventName.trim().length === 0) {
			throw new BadRequestError('Nome do evento é obrigatório')
		}

		try {
			const event = await this.eventRepository.create({
				tenantId,
				eventName: eventName.trim(),
				userId: userId?.trim() || null,
				properties: properties || {},
			})

			logger.debug({ eventId: event.id, tenantId, eventName }, 'Evento criado com sucesso')

			return event
		} catch (error) {
			if (error instanceof BadRequestError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar evento')
			throw new InternalServerError('Erro ao criar evento. Tente novamente.')
		}
	}
}
