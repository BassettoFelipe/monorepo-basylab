import type { PlanFeatureSlug } from "@/types/features";

export interface IPlanFeatureRepository {
  hasPlanFeature(planSlug: string, feature: PlanFeatureSlug): Promise<boolean>;
  getPlanFeatures(planSlug: string): Promise<PlanFeatureSlug[]>;
  getPlansWithFeature(feature: PlanFeatureSlug): Promise<string[]>;
}
