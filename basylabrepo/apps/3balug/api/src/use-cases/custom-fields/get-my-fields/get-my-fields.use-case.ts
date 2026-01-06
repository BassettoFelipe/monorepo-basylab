import type { User } from "@/db/schema/users";
import type { ICustomFieldRepository } from "@/repositories/contracts/custom-field.repository";
import type { ICustomFieldResponseRepository } from "@/repositories/contracts/custom-field-response.repository";
import type { IPlanFeatureRepository } from "@/repositories/contracts/plan-feature.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { PLAN_FEATURES } from "@/types/features";

type FieldWithValue = {
  id: string;
  companyId: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "phone"
    | "select"
    | "checkbox"
    | "date"
    | "file";
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  isActive: boolean;
  options: string[] | null;
  allowMultiple: boolean | null;
  validation: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  } | null;
  fileConfig: {
    maxFileSize?: number;
    maxFiles?: number;
    allowedTypes?: string[];
  } | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  value: string | null;
};

type GetMyFieldsInput = {
  user: User;
};

type GetMyFieldsOutput = {
  fields: FieldWithValue[];
  hasFeature: boolean;
};

export class GetMyFieldsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly customFieldRepository: ICustomFieldRepository,
    private readonly customFieldResponseRepository: ICustomFieldResponseRepository,
    private readonly planFeatureRepository: IPlanFeatureRepository,
  ) {}

  async execute(input: GetMyFieldsInput): Promise<GetMyFieldsOutput> {
    const { user } = input;

    if (!user.companyId) {
      return { fields: [], hasFeature: false };
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
      return { fields: [], hasFeature: false };
    }

    const activeFields = await this.customFieldRepository.findActiveByCompanyId(user.companyId);
    const userResponses = await this.customFieldResponseRepository.findByUserId(user.id);

    const fieldsWithResponses: FieldWithValue[] = activeFields.map((field) => {
      const response = userResponses.find((r) => r.fieldId === field.id);
      return {
        ...field,
        type: field.type as FieldWithValue["type"],
        value: response?.value ?? null,
      };
    });

    return { fields: fieldsWithResponses, hasFeature: true };
  }
}
