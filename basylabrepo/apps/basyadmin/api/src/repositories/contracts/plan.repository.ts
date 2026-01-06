import type { NewPlan, Plan, PlanFeature } from '@/db/schema'

export type PlanFilters = {
	tenantId: string
	search?: string
	isActive?: boolean
	limit?: number
	offset?: number
}

export type PlanListResult = {
	data: Plan[]
	total: number
	limit: number
	offset: number
}

export type PlanWithFeatures = Plan & {
	features: Array<{
		featureId: string
		featureSlug: string
		featureName: string
		value: unknown
	}>
}

export interface IPlanRepository {
	findById(id: string): Promise<Plan | null>
	findByIdWithFeatures(id: string): Promise<PlanWithFeatures | null>
	findByTenantAndSlug(tenantId: string, slug: string): Promise<Plan | null>
	findByTenantId(tenantId: string): Promise<Plan[]>
	list(filters: PlanFilters): Promise<PlanListResult>
	create(data: NewPlan): Promise<Plan>
	update(id: string, data: Partial<NewPlan>): Promise<Plan | null>
	delete(id: string): Promise<boolean>
	assignFeature(planId: string, featureId: string, value?: unknown): Promise<void>
	removeFeature(planId: string, featureId: string): Promise<void>
	getPlanFeatures(planId: string): Promise<PlanFeature[]>
}
