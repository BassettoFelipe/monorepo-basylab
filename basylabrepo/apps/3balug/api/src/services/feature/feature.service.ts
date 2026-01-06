import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { planFeatures, plans } from "@/db/schema";
import type { IFeatureService } from "@/services/contracts/feature-service.interface";
import type { PlanFeatureSlug } from "@/types/features";

export class FeatureService implements IFeatureService {
  async planHasFeature(planSlug: string, feature: PlanFeatureSlug): Promise<boolean> {
    const result = await db
      .select({ featureSlug: planFeatures.featureSlug })
      .from(planFeatures)
      .innerJoin(plans, eq(planFeatures.planId, plans.id))
      .where(and(eq(plans.slug, planSlug), eq(planFeatures.featureSlug, feature)))
      .limit(1);

    return result.length > 0;
  }

  async getPlanFeatures(planSlug: string): Promise<PlanFeatureSlug[]> {
    const result = await db
      .select({ featureSlug: planFeatures.featureSlug })
      .from(planFeatures)
      .innerJoin(plans, eq(planFeatures.planId, plans.id))
      .where(eq(plans.slug, planSlug));

    return result.map((r) => r.featureSlug as PlanFeatureSlug);
  }

  async getPlansWithFeature(feature: PlanFeatureSlug): Promise<string[]> {
    const result = await db
      .select({ planSlug: plans.slug })
      .from(planFeatures)
      .innerJoin(plans, eq(planFeatures.planId, plans.id))
      .where(eq(planFeatures.featureSlug, feature));

    return result.map((r) => r.planSlug);
  }
}
