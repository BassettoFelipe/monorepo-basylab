export type PropertyType = "house" | "apartment" | "land" | "commercial" | "rural";
export type ListingType = "rent" | "sale" | "both";
export type PropertyStatus = "available" | "rented" | "sold" | "maintenance" | "unavailable";

export interface PropertyFeatures {
  hasPool?: boolean;
  hasGarden?: boolean;
  hasGarage?: boolean;
  hasElevator?: boolean;
  hasGym?: boolean;
  hasPlayground?: boolean;
  hasSecurity?: boolean;
  hasAirConditioning?: boolean;
  hasFurnished?: boolean;
  hasPetFriendly?: boolean;
  hasBalcony?: boolean;
  hasBarbecue?: boolean;
}

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
  order: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface Property {
  id: string;
  ownerId: string;
  brokerId: string | null;
  title: string;
  description: string | null;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  area: number | null;
  rentalPrice: number | null;
  salePrice: number | null;
  iptuPrice: number | null;
  condoFee: number | null;
  features: PropertyFeatures | null;
  owner?: {
    id: string;
    name: string;
  };
  broker?: {
    id: string;
    name: string;
  } | null;
  photos?: PropertyPhoto[];
}

export interface CreatePropertyInput {
  ownerId: string;
  brokerId?: string;
  title: string;
  description?: string;
  type: PropertyType;
  listingType: ListingType;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  area?: number;
  rentalPrice?: number;
  salePrice?: number;
  iptuPrice?: number;
  condoFee?: number;
  features?: PropertyFeatures;
}

export interface UpdatePropertyInput {
  ownerId?: string;
  brokerId?: string | null;
  title?: string;
  description?: string | null;
  type?: PropertyType;
  listingType?: ListingType;
  status?: PropertyStatus;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  area?: number | null;
  rentalPrice?: number | null;
  salePrice?: number | null;
  iptuPrice?: number | null;
  condoFee?: number | null;
  features?: PropertyFeatures;
}

export interface ListPropertiesParams {
  search?: string;
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
  page?: number;
  limit?: number;
}

export interface ListPropertiesApiResponse {
  data: Property[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListPropertiesResponse {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
