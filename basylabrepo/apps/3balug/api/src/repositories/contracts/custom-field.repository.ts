import type { CustomField, NewCustomField } from "@/db/schema/custom-fields";

export interface ICustomFieldRepository {
  findById(id: string): Promise<CustomField | null>;
  findByCompanyId(companyId: string): Promise<CustomField[]>;
  findActiveByCompanyId(companyId: string): Promise<CustomField[]>;
  hasUserPendingRequiredFields(userId: string, companyId: string): Promise<boolean>;
  create(data: NewCustomField): Promise<CustomField>;
  update(id: string, data: Partial<NewCustomField>): Promise<CustomField | null>;
  delete(id: string): Promise<boolean>;
  reorder(companyId: string, fieldIds: string[]): Promise<void>;
}
