import { BadRequestError, InternalServerError } from '@basylab/core/errors'
import { createLogger } from '@basylab/core/logger'
import type { Event } from '@/db/schema'
import type { IEventRepository } from '@/repositories/contracts/event.repository'

const logger = createLogger({ service: 'create-events-batch-use-case' })

type EventInput = {
	eventName: string
	userId?: string
	properties?: Record<string, unknown>
}

type CreateEventsBatchInput = {
	tenantId: string
	events: EventInput[]
}

type CreateEventsBatchOutput = Event[]

export class CreateEventsBatchUseCase {
	constructor(private readonly eventRepository: IEventRepository) {}

	async execute(input: CreateEventsBatchInput): Promise<CreateEventsBatchOutput> {
		const { tenantId, events } = input

		if (!events || events.length === 0) {
			throw new BadRequestError('Lista de eventos é obrigatória')
		}

		const eventsData = events.map((event) => {
			if (!event.eventName || event.eventName.trim().length === 0) {
				throw new BadRequestError('Nome do evento é obrigatório')
			}

			return {
				tenantId,
				eventName: event.eventName.trim(),
				userId: event.userId?.trim() || null,
				properties: event.properties || {},
			}
		})

		try {
			const createdEvents = await this.eventRepository.createBatch(eventsData)

			logger.debug({ tenantId, count: createdEvents.length }, 'Batch de eventos criado com sucesso')

			return createdEvents
		} catch (error) {
			if (error instanceof BadRequestError) {
				throw error
			}
			logger.error({ err: error }, 'Erro ao criar batch de eventos')
			throw new InternalServerError('Erro ao criar batch de eventos. Tente novamente.')
		}
	}
}
