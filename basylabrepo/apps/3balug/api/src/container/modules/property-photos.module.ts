import { getStorageService } from "@/services/storage";
import { AddPropertyPhotoUseCase } from "@/use-cases/property-photos/add-property-photo/add-property-photo.use-case";
import { RemovePropertyPhotoUseCase } from "@/use-cases/property-photos/remove-property-photo/remove-property-photo.use-case";
import { SetPrimaryPhotoUseCase } from "@/use-cases/property-photos/set-primary-photo/set-primary-photo.use-case";
import { repositories } from "./repositories";

export function createPropertyPhotoUseCases() {
  return {
    add: new AddPropertyPhotoUseCase(
      repositories.propertyPhotoRepository,
      repositories.propertyRepository,
    ),
    remove: new RemovePropertyPhotoUseCase(
      repositories.propertyPhotoRepository,
      repositories.propertyRepository,
      getStorageService(),
    ),
    setPrimary: new SetPrimaryPhotoUseCase(
      repositories.propertyPhotoRepository,
      repositories.propertyRepository,
    ),
  };
}
