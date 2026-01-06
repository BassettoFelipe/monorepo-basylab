import type { PlanFeatureSlug } from "@/types/features";

export interface IFeatureService {
  /**
   * Verifica se um plano tem acesso a uma feature específica.
   */
  planHasFeature(planSlug: string, feature: PlanFeatureSlug): Promise<boolean>;

  /**
   * Lista todas as features de um plano.
   */
  getPlanFeatures(planSlug: string): Promise<PlanFeatureSlug[]>;

  /**
   * Lista todos os planos que têm acesso a uma feature.
   */
  getPlansWithFeature(feature: PlanFeatureSlug): Promise<string[]>;
}
