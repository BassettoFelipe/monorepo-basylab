import { CreateCustomFieldUseCase } from "@/use-cases/custom-fields/create-custom-field/create-custom-field.use-case";
import { DeleteCustomFieldUseCase } from "@/use-cases/custom-fields/delete-custom-field/delete-custom-field.use-case";
import { GetMyFieldsUseCase } from "@/use-cases/custom-fields/get-my-fields/get-my-fields.use-case";
import { GetUserFieldsUseCase } from "@/use-cases/custom-fields/get-user-fields/get-user-fields.use-case";
import { ListCustomFieldsUseCase } from "@/use-cases/custom-fields/list-custom-fields/list-custom-fields.use-case";
import { ReorderCustomFieldsUseCase } from "@/use-cases/custom-fields/reorder-custom-fields/reorder-custom-fields.use-case";
import { SaveMyFieldsUseCase } from "@/use-cases/custom-fields/save-my-fields/save-my-fields.use-case";
import { UpdateCustomFieldUseCase } from "@/use-cases/custom-fields/update-custom-field/update-custom-field.use-case";
import { repositories } from "./repositories";
import { services } from "./services";

export function createCustomFieldUseCases() {
  return {
    create: new CreateCustomFieldUseCase(
      repositories.customFieldRepository,
      repositories.subscriptionRepository,
      repositories.planFeatureRepository,
      services.customFieldCacheService,
    ),
    list: new ListCustomFieldsUseCase(
      repositories.customFieldRepository,
      repositories.subscriptionRepository,
      repositories.planFeatureRepository,
      services.customFieldCacheService,
    ),
    update: new UpdateCustomFieldUseCase(
      repositories.customFieldRepository,
      services.customFieldCacheService,
    ),
    delete: new DeleteCustomFieldUseCase(
      repositories.customFieldRepository,
      services.customFieldCacheService,
    ),
    reorder: new ReorderCustomFieldsUseCase(
      repositories.customFieldRepository,
      services.customFieldCacheService,
    ),
    getMyFields: new GetMyFieldsUseCase(
      repositories.userRepository,
      repositories.subscriptionRepository,
      repositories.customFieldRepository,
      repositories.customFieldResponseRepository,
      repositories.planFeatureRepository,
    ),
    saveMyFields: new SaveMyFieldsUseCase(
      repositories.userRepository,
      repositories.subscriptionRepository,
      repositories.customFieldRepository,
      repositories.customFieldResponseRepository,
      repositories.planFeatureRepository,
    ),
    getUserFields: new GetUserFieldsUseCase(
      repositories.userRepository,
      repositories.subscriptionRepository,
      repositories.customFieldRepository,
      repositories.customFieldResponseRepository,
      repositories.planFeatureRepository,
    ),
  };
}
