import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { type NewPlan, type Plan, planFeatures, plans } from '../db/schema'

export const PlanRepository = {
	async findById(id: string): Promise<Plan | undefined> {
		return db.query.plans.findFirst({
			where: eq(plans.id, id),
		})
	},

	async findByTenantAndSlug(tenantId: string, slug: string): Promise<Plan | undefined> {
		return db.query.plans.findFirst({
			where: and(eq(plans.tenantId, tenantId), eq(plans.slug, slug)),
		})
	},

	async findByTenantId(tenantId: string): Promise<Plan[]> {
		return db.query.plans.findMany({
			where: eq(plans.tenantId, tenantId),
			orderBy: (plans, { asc }) => [asc(plans.displayOrder)],
		})
	},

	async create(data: NewPlan): Promise<Plan> {
		const [plan] = await db.insert(plans).values(data).returning()
		return plan
	},

	async update(id: string, data: Partial<NewPlan>): Promise<Plan> {
		const [plan] = await db
			.update(plans)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(plans.id, id))
			.returning()
		return plan
	},

	async delete(id: string): Promise<void> {
		await db.delete(plans).where(eq(plans.id, id))
	},

	async assignFeature(planId: string, featureId: string, value: unknown = true): Promise<void> {
		await db
			.insert(planFeatures)
			.values({ planId, featureId, value })
			.onConflictDoUpdate({
				target: [planFeatures.planId, planFeatures.featureId],
				set: { value },
			})
	},

	async removeFeature(planId: string, featureId: string): Promise<void> {
		await db
			.delete(planFeatures)
			.where(and(eq(planFeatures.planId, planId), eq(planFeatures.featureId, featureId)))
	},

	async getPlanFeatures(planId: string) {
		return db.query.planFeatures.findMany({
			where: eq(planFeatures.planId, planId),
			with: {
				// Note: Need to set up relations for this to work
			},
		})
	},
}
