import type { NewTicket, NewTicketMessage, Ticket, TicketMessage } from '@/db/schema'

export type TicketFilters = {
	tenantId?: string
	tenantIds?: string[]
	status?: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
	priority?: 'low' | 'medium' | 'high' | 'urgent'
	assignedTo?: string
	limit?: number
	offset?: number
}

export type TicketListResult = {
	data: Ticket[]
	total: number
	limit: number
	offset: number
}

export type TicketWithMessages = Ticket & {
	messages: TicketMessage[]
}

export interface ITicketRepository {
	findById(id: string): Promise<Ticket | null>
	findByIdWithMessages(id: string): Promise<TicketWithMessages | null>
	findByTenantId(tenantId: string): Promise<Ticket[]>
	findByTenantIds(tenantIds: string[]): Promise<Ticket[]>
	findAll(): Promise<Ticket[]>
	list(filters: TicketFilters): Promise<TicketListResult>
	create(data: NewTicket): Promise<Ticket>
	update(id: string, data: Partial<NewTicket>): Promise<Ticket | null>
	delete(id: string): Promise<boolean>
	getMessages(ticketId: string): Promise<TicketMessage[]>
	addMessage(data: NewTicketMessage): Promise<TicketMessage>
}
