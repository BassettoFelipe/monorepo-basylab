import type { PlanFeatureSlug } from '@/types/features'

export interface IPlanFeatureRepository {
	planHasFeature(planSlug: string, feature: PlanFeatureSlug): Promise<boolean>
	getPlanFeatures(planSlug: string): Promise<PlanFeatureSlug[]>
	getPlansWithFeature(feature: PlanFeatureSlug): Promise<string[]>
}
