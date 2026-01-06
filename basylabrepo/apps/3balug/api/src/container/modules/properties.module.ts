import { CreatePropertyUseCase } from "@/use-cases/properties/create-property/create-property.use-case";
import { DeletePropertyUseCase } from "@/use-cases/properties/delete-property/delete-property.use-case";
import { GetPropertyUseCase } from "@/use-cases/properties/get-property/get-property.use-case";
import { ListPropertiesUseCase } from "@/use-cases/properties/list-properties/list-properties.use-case";
import { UpdatePropertyUseCase } from "@/use-cases/properties/update-property/update-property.use-case";
import {
  contractRepository,
  propertyOwnerRepository,
  propertyPhotoRepository,
  propertyRepository,
  userRepository,
} from "./repositories";

export function createPropertyUseCases() {
  return {
    create: new CreatePropertyUseCase(propertyRepository, propertyOwnerRepository),
    list: new ListPropertiesUseCase(propertyRepository),
    get: new GetPropertyUseCase(
      propertyRepository,
      propertyOwnerRepository,
      propertyPhotoRepository,
      userRepository,
    ),
    update: new UpdatePropertyUseCase(propertyRepository, propertyOwnerRepository),
    delete: new DeletePropertyUseCase(
      propertyRepository,
      contractRepository,
      propertyPhotoRepository,
    ),
  };
}
