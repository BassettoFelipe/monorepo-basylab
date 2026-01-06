import { AddTicketMessageUseCase } from '@/use-cases/tickets/add-ticket-message/add-ticket-message.use-case'
import { CreateTicketUseCase } from '@/use-cases/tickets/create-ticket/create-ticket.use-case'
import { GetTicketUseCase } from '@/use-cases/tickets/get-ticket/get-ticket.use-case'
import { ListTicketsUseCase } from '@/use-cases/tickets/list-tickets/list-tickets.use-case'
import { UpdateTicketUseCase } from '@/use-cases/tickets/update-ticket/update-ticket.use-case'
import { repositories } from './repositories'

export function createTicketUseCases() {
	return {
		create: new CreateTicketUseCase(repositories.ticketRepository),
		list: new ListTicketsUseCase(repositories.ticketRepository, repositories.tenantRepository),
		get: new GetTicketUseCase(repositories.ticketRepository, repositories.tenantRepository),
		update: new UpdateTicketUseCase(repositories.ticketRepository, repositories.tenantRepository),
		addMessage: new AddTicketMessageUseCase(
			repositories.ticketRepository,
			repositories.tenantRepository,
		),
	}
}
