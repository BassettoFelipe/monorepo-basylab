import type { Event } from '@/db/schema'
import type { IEventRepository } from '@/repositories/contracts/event.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

type ListEventsInput = {
	userRole: 'owner' | 'manager'
	userId: string
	tenantId?: string
	eventName?: string
	eventUserId?: string
	startDate?: Date
	endDate?: Date
	limit?: number
	offset?: number
}

type ListEventsOutput = {
	data: Event[]
	total: number
	limit: number
	offset: number
}

export class ListEventsUseCase {
	constructor(
		private readonly eventRepository: IEventRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: ListEventsInput): Promise<ListEventsOutput> {
		const {
			userRole,
			userId,
			tenantId,
			eventName,
			eventUserId,
			startDate,
			endDate,
			limit = 100,
			offset = 0,
		} = input

		let effectiveTenantId = tenantId

		if (tenantId) {
			if (userRole !== 'owner') {
				const hasAccess = await this.tenantRepository.isManagerOfTenant(userId, tenantId)
				if (!hasAccess) {
					return { data: [], total: 0, limit, offset }
				}
			}
		} else if (userRole !== 'owner') {
			const tenants = await this.tenantRepository.findByManagerId(userId)
			if (tenants.length === 0) {
				return { data: [], total: 0, limit, offset }
			}
			effectiveTenantId = tenants[0].id
		}

		return await this.eventRepository.findByFilters({
			tenantId: effectiveTenantId,
			eventName,
			userId: eventUserId,
			startDate,
			endDate,
			limit,
			offset,
		})
	}
}
