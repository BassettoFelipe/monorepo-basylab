import { CreateCustomFieldUseCase } from "@/use-cases/custom-fields/create-custom-field/create-custom-field.use-case";
import { DeleteCustomFieldUseCase } from "@/use-cases/custom-fields/delete-custom-field/delete-custom-field.use-case";
import { GetMyFieldsUseCase } from "@/use-cases/custom-fields/get-my-fields/get-my-fields.use-case";
import { GetUserFieldsUseCase } from "@/use-cases/custom-fields/get-user-fields/get-user-fields.use-case";
import { ListCustomFieldsUseCase } from "@/use-cases/custom-fields/list-custom-fields/list-custom-fields.use-case";
import { ReorderCustomFieldsUseCase } from "@/use-cases/custom-fields/reorder-custom-fields/reorder-custom-fields.use-case";
import { SaveMyFieldsUseCase } from "@/use-cases/custom-fields/save-my-fields/save-my-fields.use-case";
import { UpdateCustomFieldUseCase } from "@/use-cases/custom-fields/update-custom-field/update-custom-field.use-case";
import {
  customFieldRepository,
  customFieldResponseRepository,
  planFeatureRepository,
  subscriptionRepository,
  userRepository,
} from "./repositories";
import { customFieldCacheService } from "./services";

export function createCustomFieldUseCases() {
  return {
    create: new CreateCustomFieldUseCase(
      customFieldRepository,
      subscriptionRepository,
      planFeatureRepository,
      customFieldCacheService,
    ),
    list: new ListCustomFieldsUseCase(
      customFieldRepository,
      subscriptionRepository,
      planFeatureRepository,
      customFieldCacheService,
    ),
    update: new UpdateCustomFieldUseCase(customFieldRepository, customFieldCacheService),
    delete: new DeleteCustomFieldUseCase(customFieldRepository, customFieldCacheService),
    reorder: new ReorderCustomFieldsUseCase(customFieldRepository, customFieldCacheService),
    getMyFields: new GetMyFieldsUseCase(
      userRepository,
      subscriptionRepository,
      customFieldRepository,
      customFieldResponseRepository,
      planFeatureRepository,
    ),
    saveMyFields: new SaveMyFieldsUseCase(
      userRepository,
      subscriptionRepository,
      customFieldRepository,
      customFieldResponseRepository,
      planFeatureRepository,
    ),
    getUserFields: new GetUserFieldsUseCase(
      userRepository,
      subscriptionRepository,
      customFieldRepository,
      customFieldResponseRepository,
      planFeatureRepository,
    ),
  };
}
