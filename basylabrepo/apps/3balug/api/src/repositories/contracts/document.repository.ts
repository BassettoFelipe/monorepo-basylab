import type { Document, DocumentEntityType, NewDocument } from "@/db/schema/documents";

export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findByEntity(
    entityType: DocumentEntityType,
    entityId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Document[]>;
  findByEntityAndType(
    entityType: DocumentEntityType,
    entityId: string,
    documentType: string,
  ): Promise<Document[]>;
  create(data: NewDocument): Promise<Document>;
  update(id: string, data: Partial<NewDocument>): Promise<Document | null>;
  delete(id: string): Promise<boolean>;
  deleteByEntity(entityType: DocumentEntityType, entityId: string): Promise<boolean>;
  countByEntity(entityType: DocumentEntityType, entityId: string): Promise<number>;
}
