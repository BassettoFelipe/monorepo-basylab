import { BadRequestError, ForbiddenError } from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { ICustomFieldRepository } from "@/repositories/contracts/custom-field.repository";
import type { ICustomFieldResponseRepository } from "@/repositories/contracts/custom-field-response.repository";
import type { IPlanFeatureRepository } from "@/repositories/contracts/plan-feature.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { PLAN_FEATURES } from "@/types/features";

type FieldValue = {
  fieldId: string;
  value: string | null;
};

type SaveMyFieldsInput = {
  user: User;
  fields: FieldValue[];
};

type SaveMyFieldsOutput = {
  success: true;
  message: string;
};

export class SaveMyFieldsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly customFieldRepository: ICustomFieldRepository,
    private readonly customFieldResponseRepository: ICustomFieldResponseRepository,
    private readonly planFeatureRepository: IPlanFeatureRepository,
  ) {}

  async execute(input: SaveMyFieldsInput): Promise<SaveMyFieldsOutput> {
    const { user, fields } = input;

    if (!user.companyId) {
      throw new ForbiddenError("Usuário não está vinculado a uma empresa");
    }

    let subscription = await this.subscriptionRepository.findCurrentByUserId(user.id);

    if (!subscription && user.createdBy) {
      const owner = await this.userRepository.findById(user.createdBy);
      if (owner) {
        subscription = await this.subscriptionRepository.findCurrentByUserId(owner.id);
      }
    }

    const hasFeature =
      subscription?.plan?.slug &&
      (await this.planFeatureRepository.planHasFeature(
        subscription.plan.slug,
        PLAN_FEATURES.CUSTOM_FIELDS,
      ));

    if (!hasFeature) {
      throw new ForbiddenError("Seu plano não tem acesso a campos customizados");
    }

    const activeFields = await this.customFieldRepository.findActiveByCompanyId(user.companyId);

    const requiredFields = activeFields.filter((f) => f.isRequired);
    for (const requiredField of requiredFields) {
      const providedValue = fields.find((f) => f.fieldId === requiredField.id);
      if (!providedValue || !providedValue.value?.trim()) {
        throw new BadRequestError(`O campo "${requiredField.label}" é obrigatório`);
      }
    }

    const validFields = fields.filter((fieldData) => {
      return activeFields.some((f) => f.id === fieldData.fieldId);
    });

    if (validFields.length > 0) {
      await this.customFieldResponseRepository.upsertMany(
        validFields.map((f) => ({
          userId: user.id,
          fieldId: f.fieldId,
          value: f.value === "" ? null : f.value,
        })),
      );
    }

    return {
      success: true,
      message: "Informações salvas com sucesso",
    };
  }
}
