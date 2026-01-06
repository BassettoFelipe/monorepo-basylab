import { getStorageService } from "@/services/storage";
import { AddDocumentUseCase } from "@/use-cases/documents/add-document/add-document.use-case";
import { ListDocumentsUseCase } from "@/use-cases/documents/list-documents/list-documents.use-case";
import { RemoveDocumentUseCase } from "@/use-cases/documents/remove-document/remove-document.use-case";
import { documentRepository, propertyOwnerRepository, tenantRepository } from "./repositories";

export function createDocumentUseCases() {
  return {
    add: new AddDocumentUseCase(documentRepository, propertyOwnerRepository, tenantRepository),
    remove: new RemoveDocumentUseCase(
      documentRepository,
      propertyOwnerRepository,
      tenantRepository,
      getStorageService(),
    ),
    list: new ListDocumentsUseCase(documentRepository, propertyOwnerRepository, tenantRepository),
  };
}
