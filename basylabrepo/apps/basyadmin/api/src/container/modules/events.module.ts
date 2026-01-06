import { AggregateEventsUseCase } from '@/use-cases/events/aggregate-events/aggregate-events.use-case'
import { CreateEventUseCase } from '@/use-cases/events/create-event/create-event.use-case'
import { CreateEventsBatchUseCase } from '@/use-cases/events/create-events-batch/create-events-batch.use-case'
import { ListEventsUseCase } from '@/use-cases/events/list-events/list-events.use-case'
import { repositories } from './repositories'

export function createEventUseCases() {
	return {
		create: new CreateEventUseCase(repositories.eventRepository),
		createBatch: new CreateEventsBatchUseCase(repositories.eventRepository),
		list: new ListEventsUseCase(repositories.eventRepository, repositories.tenantRepository),
		aggregate: new AggregateEventsUseCase(
			repositories.eventRepository,
			repositories.tenantRepository,
		),
	}
}
