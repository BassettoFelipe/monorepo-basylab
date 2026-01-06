import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import {
	type NewTicket,
	type NewTicketMessage,
	type Ticket,
	type TicketMessage,
	ticketMessages,
	tickets,
} from '../db/schema'

export const TicketRepository = {
	async findById(id: string): Promise<Ticket | undefined> {
		return db.query.tickets.findFirst({
			where: eq(tickets.id, id),
		})
	},

	async findByTenantId(tenantId: string): Promise<Ticket[]> {
		return db.query.tickets.findMany({
			where: eq(tickets.tenantId, tenantId),
			orderBy: [desc(tickets.createdAt)],
		})
	},

	async findByTenantIds(tenantIds: string[]): Promise<Ticket[]> {
		if (tenantIds.length === 0) return []
		return db.query.tickets.findMany({
			where: inArray(tickets.tenantId, tenantIds),
			orderBy: [desc(tickets.createdAt)],
		})
	},

	async findAll(): Promise<Ticket[]> {
		return db.query.tickets.findMany({
			orderBy: [desc(tickets.createdAt)],
		})
	},

	async create(data: NewTicket): Promise<Ticket> {
		const [ticket] = await db.insert(tickets).values(data).returning()
		return ticket
	},

	async update(id: string, data: Partial<NewTicket>): Promise<Ticket> {
		const [ticket] = await db
			.update(tickets)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(tickets.id, id))
			.returning()
		return ticket
	},

	async delete(id: string): Promise<void> {
		await db.delete(tickets).where(eq(tickets.id, id))
	},

	async addMessage(data: NewTicketMessage): Promise<TicketMessage> {
		const [message] = await db.insert(ticketMessages).values(data).returning()
		return message
	},

	async getMessages(ticketId: string): Promise<TicketMessage[]> {
		return db.query.ticketMessages.findMany({
			where: eq(ticketMessages.ticketId, ticketId),
			orderBy: [ticketMessages.createdAt],
		})
	},
}
