import type { NewPropertyPhoto, PropertyPhoto } from "@/db/schema/property-photos";

export interface IPropertyPhotoRepository {
  findById(id: string): Promise<PropertyPhoto | null>;
  findByPropertyId(propertyId: string): Promise<PropertyPhoto[]>;
  findPrimaryByPropertyId(propertyId: string): Promise<PropertyPhoto | null>;
  create(data: NewPropertyPhoto): Promise<PropertyPhoto>;
  createAsPrimary(data: NewPropertyPhoto, propertyId: string): Promise<PropertyPhoto>;
  createMany(data: NewPropertyPhoto[]): Promise<PropertyPhoto[]>;
  update(id: string, data: Partial<NewPropertyPhoto>): Promise<PropertyPhoto | null>;
  delete(id: string): Promise<boolean>;
  deleteByPropertyId(propertyId: string): Promise<boolean>;
  setPrimary(id: string, propertyId: string): Promise<boolean>;
  updateOrder(id: string, order: number): Promise<PropertyPhoto | null>;
  countByPropertyId(propertyId: string): Promise<number>;
}
