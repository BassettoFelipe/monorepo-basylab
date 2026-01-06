import { db } from "@/db";
import { features, planFeatures, plans } from "@/db/schema";

const SYSTEM_FEATURES = [
  {
    slug: "custom_fields",
    name: "Campos Customizados",
    description: "Permite criar campos personalizados nos formulários de cadastro",
  },
] as const;

const PLAN_FEATURE_MAP: Record<string, string[]> = {
  basico: [],
  imobiliaria: [],
  house: ["custom_fields"],
};

export async function seedFeatures() {
  await db.delete(planFeatures);
  await db.delete(features);

  await db.insert(features).values(
    SYSTEM_FEATURES.map((f) => ({
      slug: f.slug,
      name: f.name,
      description: f.description,
    })),
  );

  const existingPlans = await db.select().from(plans);

  const planFeatureValues: { planId: string; featureSlug: string }[] = [];

  for (const plan of existingPlans) {
    const planSlug = plan.slug;
    const featureSlugs = PLAN_FEATURE_MAP[planSlug] || [];

    for (const featureSlug of featureSlugs) {
      planFeatureValues.push({
        planId: plan.id,
        featureSlug,
      });
    }
  }

  if (planFeatureValues.length > 0) {
    await db.insert(planFeatures).values(planFeatureValues);
  }
}
