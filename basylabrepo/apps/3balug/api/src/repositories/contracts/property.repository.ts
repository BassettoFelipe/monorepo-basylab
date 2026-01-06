import type {
  ListingType,
  NewProperty,
  Property,
  PropertyStatus,
  PropertyType,
} from "@/db/schema/properties";

export type PropertyFilters = {
  search?: string; // Busca por título, endereço ou cidade
  companyId: string;
  ownerId?: string;
  brokerId?: string;
  type?: PropertyType;
  listingType?: ListingType;
  status?: PropertyStatus;
  city?: string;
  minRentalPrice?: number;
  maxRentalPrice?: number;
  minSalePrice?: number;
  maxSalePrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  limit?: number;
  offset?: number;
};

export type PropertyListResult = {
  data: Property[];
  total: number;
  limit: number;
  offset: number;
};

export type PropertyStats = {
  total: number;
  available: number;
  rented: number;
  sold: number;
  maintenance: number;
};

export interface IPropertyRepository {
  findById(id: string): Promise<Property | null>;
  findByCompanyId(companyId: string): Promise<Property[]>;
  findByOwnerId(ownerId: string): Promise<Property[]>;
  findByBrokerId(brokerId: string): Promise<Property[]>;
  list(filters: PropertyFilters): Promise<PropertyListResult>;
  create(data: NewProperty): Promise<Property>;
  update(id: string, data: Partial<NewProperty>): Promise<Property | null>;
  delete(id: string): Promise<boolean>;
  deleteWithPhotos(id: string): Promise<boolean>;
  countByCompanyId(companyId: string): Promise<number>;
  countByOwnerId(ownerId: string): Promise<number>;
  getStatsByCompanyId(companyId: string): Promise<PropertyStats>;
  getStatsByBrokerId(brokerId: string, companyId: string): Promise<PropertyStats>;
}
