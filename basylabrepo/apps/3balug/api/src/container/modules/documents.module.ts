import { getStorageService } from '@/services/storage'
import { AddDocumentUseCase } from '@/use-cases/documents/add-document/add-document.use-case'
import { ListDocumentsUseCase } from '@/use-cases/documents/list-documents/list-documents.use-case'
import { RemoveDocumentUseCase } from '@/use-cases/documents/remove-document/remove-document.use-case'
import { repositories } from './repositories'

export function createDocumentUseCases() {
	return {
		add: new AddDocumentUseCase(
			repositories.documentRepository,
			repositories.propertyOwnerRepository,
			repositories.tenantRepository,
		),
		remove: new RemoveDocumentUseCase(
			repositories.documentRepository,
			repositories.propertyOwnerRepository,
			repositories.tenantRepository,
			getStorageService(),
		),
		list: new ListDocumentsUseCase(
			repositories.documentRepository,
			repositories.propertyOwnerRepository,
			repositories.tenantRepository,
		),
	}
}
