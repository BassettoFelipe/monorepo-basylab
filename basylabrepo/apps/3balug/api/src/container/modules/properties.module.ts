import { CreatePropertyUseCase } from "@/use-cases/properties/create-property/create-property.use-case";
import { DeletePropertyUseCase } from "@/use-cases/properties/delete-property/delete-property.use-case";
import { GetPropertyUseCase } from "@/use-cases/properties/get-property/get-property.use-case";
import { ListPropertiesUseCase } from "@/use-cases/properties/list-properties/list-properties.use-case";
import { UpdatePropertyUseCase } from "@/use-cases/properties/update-property/update-property.use-case";
import { repositories } from "./repositories";

export function createPropertyUseCases() {
  return {
    create: new CreatePropertyUseCase(
      repositories.propertyRepository,
      repositories.propertyOwnerRepository,
    ),
    list: new ListPropertiesUseCase(repositories.propertyRepository),
    get: new GetPropertyUseCase(
      repositories.propertyRepository,
      repositories.propertyOwnerRepository,
      repositories.propertyPhotoRepository,
      repositories.userRepository,
    ),
    update: new UpdatePropertyUseCase(
      repositories.propertyRepository,
      repositories.propertyOwnerRepository,
    ),
    delete: new DeletePropertyUseCase(
      repositories.propertyRepository,
      repositories.contractRepository,
      repositories.propertyPhotoRepository,
    ),
  };
}
