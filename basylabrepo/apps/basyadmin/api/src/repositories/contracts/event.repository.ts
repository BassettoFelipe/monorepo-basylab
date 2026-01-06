import type { Event, NewEvent } from '@/db/schema'

export type EventFilters = {
	tenantId?: string
	eventName?: string
	userId?: string
	startDate?: Date
	endDate?: Date
	limit?: number
	offset?: number
}

export type EventListResult = {
	data: Event[]
	total: number
	limit: number
	offset: number
}

export type EventAggregate = {
	eventName: string
	count: number
	uniqueUsers: number
}

export interface IEventRepository {
	findById(id: string): Promise<Event | null>
	findByFilters(filters: EventFilters): Promise<EventListResult>
	create(data: NewEvent): Promise<Event>
	createBatch(data: NewEvent[]): Promise<Event[]>
	aggregate(tenantId: string, startDate?: Date, endDate?: Date): Promise<EventAggregate[]>
	countByTenant(tenantId: string): Promise<number>
}
