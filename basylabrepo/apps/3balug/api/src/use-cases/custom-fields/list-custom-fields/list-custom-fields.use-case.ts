import { BadRequestError, ForbiddenError } from "@basylab/core/errors";
import type { CustomField } from "@/db/schema/custom-fields";
import type { User } from "@/db/schema/users";
import type { ICustomFieldCacheService } from "@/services/cache";
import type { ICustomFieldRepository } from "@/repositories/contracts/custom-field.repository";
import type { IPlanFeatureRepository } from "@/repositories/contracts/plan-feature.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import { PLAN_FEATURES } from "@/types/features";
import { USER_ROLES } from "@/types/roles";

type ListCustomFieldsInput = {
  user: User;
  includeInactive?: boolean;
};

type ListCustomFieldsOutput = {
  fields: CustomField[];
  hasFeature: boolean;
};

export class ListCustomFieldsUseCase {
  constructor(
    private readonly customFieldRepository: ICustomFieldRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planFeatureRepository: IPlanFeatureRepository,
    private readonly cache?: ICustomFieldCacheService,
  ) {}

  async execute(input: ListCustomFieldsInput): Promise<ListCustomFieldsOutput> {
    if (input.user.role !== USER_ROLES.OWNER && input.user.role !== USER_ROLES.MANAGER) {
      throw new ForbiddenError("Você não tem permissão para visualizar campos personalizados.");
    }

    if (!input.user.companyId) {
      throw new BadRequestError("Usuário sem empresa vinculada.");
    }

    let hasFeature = false;
    const subscription = await this.subscriptionRepository.findCurrentByUserId(input.user.id);

    if (subscription?.plan?.slug) {
      hasFeature = await this.planFeatureRepository.planHasFeature(
        subscription.plan.slug,
        PLAN_FEATURES.CUSTOM_FIELDS,
      );
    }

    // Se o plano não permite, retorna lista vazia com flag indicando
    if (!hasFeature) {
      return {
        fields: [],
        hasFeature: false,
      };
    }

    let fields: CustomField[];

    if (input.includeInactive) {
      const cached = await this.cache?.getAllFields(input.user.companyId);
      if (cached) {
        fields = cached;
      } else {
        fields = await this.customFieldRepository.findByCompanyId(input.user.companyId);
        await this.cache?.setAllFields(input.user.companyId, fields);
      }
    } else {
      const cached = await this.cache?.getActiveFields(input.user.companyId);
      if (cached) {
        fields = cached;
      } else {
        fields = await this.customFieldRepository.findActiveByCompanyId(input.user.companyId);
        await this.cache?.setActiveFields(input.user.companyId, fields);
      }
    }

    return {
      fields,
      hasFeature: true,
    };
  }
}
