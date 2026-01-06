import type { NewPlan, Plan } from '@/db/schema/plans'

export interface IPlanRepository {
	findById(id: string): Promise<Plan | null>
	findBySlug(slug: string): Promise<Plan | null>
	findAll(): Promise<Plan[]>
	create(data: NewPlan): Promise<Plan>
	update(id: string, data: Partial<NewPlan>): Promise<Plan | null>
	delete(id: string): Promise<boolean>
}
