import { and, count, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../db'
import { type Event, events, type NewEvent } from '../db/schema'

export type EventFilters = {
	tenantId?: string
	eventName?: string
	userId?: string
	startDate?: Date
	endDate?: Date
}

export type EventAggregate = {
	eventName: string
	count: number
}

export const EventRepository = {
	async findById(id: string): Promise<Event | undefined> {
		return db.query.events.findFirst({
			where: eq(events.id, id),
		})
	},

	async findByFilters(filters: EventFilters, limit = 100, offset = 0): Promise<Event[]> {
		const conditions = []

		if (filters.tenantId) {
			conditions.push(eq(events.tenantId, filters.tenantId))
		}
		if (filters.eventName) {
			conditions.push(eq(events.eventName, filters.eventName))
		}
		if (filters.userId) {
			conditions.push(eq(events.userId, filters.userId))
		}
		if (filters.startDate) {
			conditions.push(gte(events.createdAt, filters.startDate))
		}
		if (filters.endDate) {
			conditions.push(lte(events.createdAt, filters.endDate))
		}

		return db.query.events.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			orderBy: [desc(events.createdAt)],
			limit,
			offset,
		})
	},

	async create(data: NewEvent): Promise<Event> {
		const [event] = await db.insert(events).values(data).returning()
		return event
	},

	async createBatch(data: NewEvent[]): Promise<Event[]> {
		if (data.length === 0) return []
		return db.insert(events).values(data).returning()
	},

	async aggregate(tenantId: string, startDate?: Date, endDate?: Date): Promise<EventAggregate[]> {
		const conditions = [eq(events.tenantId, tenantId)]

		if (startDate) {
			conditions.push(gte(events.createdAt, startDate))
		}
		if (endDate) {
			conditions.push(lte(events.createdAt, endDate))
		}

		const result = await db
			.select({
				eventName: events.eventName,
				count: count(),
			})
			.from(events)
			.where(and(...conditions))
			.groupBy(events.eventName)
			.orderBy(desc(count()))

		return result.map((r) => ({
			eventName: r.eventName,
			count: Number(r.count),
		}))
	},

	async countByTenant(tenantId: string): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(events)
			.where(eq(events.tenantId, tenantId))

		return Number(result.count)
	},
}
