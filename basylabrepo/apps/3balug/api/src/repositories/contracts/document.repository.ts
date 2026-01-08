import type { Document, DocumentEntityType, NewDocument } from '@/db/schema/documents'

export interface BatchDocumentsInput {
	toDelete: string[]
	toAdd: NewDocument[]
}

export interface BatchDocumentsResult {
	deleted: string[]
	added: Document[]
}

export interface SoftDeleteInput {
	deletedBy: string
}

export interface IDocumentRepository {
	findById(id: string): Promise<Document | null>
	findByIds(ids: string[]): Promise<Document[]>
	findByEntity(
		entityType: DocumentEntityType,
		entityId: string,
		options?: { limit?: number; offset?: number },
	): Promise<Document[]>
	findByEntityAndType(
		entityType: DocumentEntityType,
		entityId: string,
		documentType: string,
	): Promise<Document[]>
	findByEntityTypeAndIds(
		entityType: DocumentEntityType,
		entityIds: string[],
		documentType: string,
	): Promise<Map<string, Document[]>>
	findDeletedByEntity(
		entityType: DocumentEntityType,
		entityId: string,
		options?: { limit?: number; offset?: number },
	): Promise<Document[]>
	countDeletedByEntity(entityType: DocumentEntityType, entityId: string): Promise<number>
	create(data: NewDocument): Promise<Document>
	createMany(data: NewDocument[]): Promise<Document[]>
	update(id: string, data: Partial<NewDocument>): Promise<Document | null>
	delete(id: string): Promise<boolean>
	softDelete(id: string, input: SoftDeleteInput): Promise<Document | null>
	deleteMany(ids: string[]): Promise<string[]>
	deleteByEntity(entityType: DocumentEntityType, entityId: string): Promise<boolean>
	countByEntity(entityType: DocumentEntityType, entityId: string): Promise<number>
	countByEntityAndType(
		entityType: DocumentEntityType,
		entityId: string,
		documentType: string,
	): Promise<number>
	batchOperations(input: BatchDocumentsInput): Promise<BatchDocumentsResult>
}
