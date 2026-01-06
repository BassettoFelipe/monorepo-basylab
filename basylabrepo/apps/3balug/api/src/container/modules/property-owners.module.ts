import { getContactValidator, getDocumentValidator } from "@/services/container";
import { CreatePropertyOwnerUseCase } from "@/use-cases/property-owners/create-property-owner/create-property-owner.use-case";
import { DeletePropertyOwnerUseCase } from "@/use-cases/property-owners/delete-property-owner/delete-property-owner.use-case";
import { GetPropertyOwnerUseCase } from "@/use-cases/property-owners/get-property-owner/get-property-owner.use-case";
import { ListPropertyOwnersUseCase } from "@/use-cases/property-owners/list-property-owners/list-property-owners.use-case";
import { UpdatePropertyOwnerUseCase } from "@/use-cases/property-owners/update-property-owner/update-property-owner.use-case";
import { propertyOwnerRepository, propertyRepository } from "./repositories";

export function createPropertyOwnerUseCases() {
  return {
    create: new CreatePropertyOwnerUseCase(
      propertyOwnerRepository,
      getDocumentValidator(),
      getContactValidator(),
    ),
    list: new ListPropertyOwnersUseCase(propertyOwnerRepository),
    get: new GetPropertyOwnerUseCase(propertyOwnerRepository),
    update: new UpdatePropertyOwnerUseCase(
      propertyOwnerRepository,
      getDocumentValidator(),
      getContactValidator(),
    ),
    delete: new DeletePropertyOwnerUseCase(propertyOwnerRepository, propertyRepository),
  };
}
