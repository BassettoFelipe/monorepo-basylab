import type { Plan } from '@/db/schema'
import type { IPlanRepository } from '@/repositories/contracts/plan.repository'

type ListPlansInput = {
	tenantId: string
	search?: string
	isActive?: boolean
	limit?: number
	offset?: number
}

type ListPlansOutput = {
	data: Plan[]
	total: number
	limit: number
	offset: number
}

export class ListPlansUseCase {
	constructor(private readonly planRepository: IPlanRepository) {}

	async execute(input: ListPlansInput): Promise<ListPlansOutput> {
		const { tenantId, search, isActive, limit = 20, offset = 0 } = input

		return await this.planRepository.list({
			tenantId,
			search,
			isActive,
			limit,
			offset,
		})
	}
}
