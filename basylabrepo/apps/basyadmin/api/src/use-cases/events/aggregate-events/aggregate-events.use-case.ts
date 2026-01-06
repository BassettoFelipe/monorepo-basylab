import { BadRequestError } from '@basylab/core/errors'
import type { EventAggregate, IEventRepository } from '@/repositories/contracts/event.repository'
import type { ITenantRepository } from '@/repositories/contracts/tenant.repository'

type AggregateEventsInput = {
	userRole: 'owner' | 'manager'
	userId: string
	tenantId: string
	startDate?: Date
	endDate?: Date
}

type AggregateEventsOutput = EventAggregate[]

export class AggregateEventsUseCase {
	constructor(
		private readonly eventRepository: IEventRepository,
		private readonly tenantRepository: ITenantRepository,
	) {}

	async execute(input: AggregateEventsInput): Promise<AggregateEventsOutput> {
		const { userRole, userId, tenantId, startDate, endDate } = input

		if (!tenantId) {
			throw new BadRequestError('Tenant ID é obrigatório')
		}

		if (userRole !== 'owner') {
			const hasAccess = await this.tenantRepository.isManagerOfTenant(userId, tenantId)
			if (!hasAccess) {
				return []
			}
		}

		return await this.eventRepository.aggregate(tenantId, startDate, endDate)
	}
}
