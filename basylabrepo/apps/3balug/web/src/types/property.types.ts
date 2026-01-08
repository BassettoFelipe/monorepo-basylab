export type PropertyType = 'house' | 'apartment' | 'land' | 'commercial' | 'rural'
export type ListingType = 'rent' | 'sale' | 'both'
export type PropertyStatus = 'available' | 'rented' | 'sold' | 'maintenance' | 'unavailable'

export interface PropertyFeatures {
	hasPool?: boolean
	hasGarden?: boolean
	hasGarage?: boolean
	hasElevator?: boolean
	hasGym?: boolean
	hasPlayground?: boolean
	hasSecurity?: boolean
	hasAirConditioning?: boolean
	hasFurnished?: boolean
	hasPetFriendly?: boolean
	hasBalcony?: boolean
	hasBarbecue?: boolean
}

export interface PropertyPhoto {
	id: string
	propertyId: string
	url: string
	order: number
	isPrimary: boolean
	createdAt: string
}

export interface Property {
	id: string
	code: string | null
	ownerId: string
	brokerId: string | null
	title: string
	description: string | null
	type: PropertyType
	listingType: ListingType
	status: PropertyStatus
	address: string | null
	addressNumber: string | null
	addressComplement: string | null
	neighborhood: string | null
	city: string | null
	state: string | null
	zipCode: string | null
	bedrooms: number | null
	bathrooms: number | null
	suites: number | null
	parkingSpaces: number | null
	area: number | null
	totalArea: number | null
	builtArea: number | null
	floor: number | null
	totalFloors: number | null
	yearBuilt: number | null
	rentalPrice: number | null
	salePrice: number | null
	iptuPrice: number | null
	condoFee: number | null
	commissionPercentage: number | null
	commissionValue: number | null
	isMarketplace: boolean
	notes: string | null
	features: PropertyFeatures | null
	createdAt?: string
	updatedAt?: string
	owner?: {
		id: string
		name: string
	}
	broker?: {
		id: string
		name: string
	} | null
	photos?: PropertyPhoto[]
}

export interface CreatePropertyInput {
	ownerId: string
	brokerId?: string
	title: string
	description?: string
	type: PropertyType
	listingType: ListingType
	address?: string
	addressNumber?: string
	addressComplement?: string
	neighborhood?: string
	city?: string
	state?: string
	zipCode?: string
	bedrooms?: number
	bathrooms?: number
	suites?: number
	parkingSpaces?: number
	area?: number
	totalArea?: number
	builtArea?: number
	floor?: number
	totalFloors?: number
	yearBuilt?: number
	rentalPrice?: number
	salePrice?: number
	iptuPrice?: number
	condoFee?: number
	commissionPercentage?: number
	commissionValue?: number
	isMarketplace?: boolean
	notes?: string
	features?: PropertyFeatures
}

export interface UpdatePropertyInput {
	ownerId?: string
	brokerId?: string | null
	title?: string
	description?: string | null
	type?: PropertyType
	listingType?: ListingType
	status?: PropertyStatus
	address?: string | null
	addressNumber?: string | null
	addressComplement?: string | null
	neighborhood?: string | null
	city?: string | null
	state?: string | null
	zipCode?: string | null
	bedrooms?: number
	bathrooms?: number
	suites?: number
	parkingSpaces?: number
	area?: number | null
	totalArea?: number | null
	builtArea?: number | null
	floor?: number | null
	totalFloors?: number | null
	yearBuilt?: number | null
	rentalPrice?: number | null
	salePrice?: number | null
	iptuPrice?: number | null
	condoFee?: number | null
	commissionPercentage?: number | null
	commissionValue?: number | null
	isMarketplace?: boolean
	notes?: string | null
	features?: PropertyFeatures
}

export type PropertySortBy = 'title' | 'createdAt' | 'rentalPrice' | 'salePrice' | 'city' | 'area'
export type PropertySortOrder = 'asc' | 'desc'

export interface ListPropertiesParams {
	search?: string
	ownerId?: string
	type?: PropertyType
	listingType?: ListingType
	status?: PropertyStatus
	state?: string
	city?: string
	minRentalPrice?: number
	maxRentalPrice?: number
	minSalePrice?: number
	maxSalePrice?: number
	minBedrooms?: number
	maxBedrooms?: number
	sortBy?: PropertySortBy
	sortOrder?: PropertySortOrder
	page?: number
	limit?: number
}

export type PropertyListItem = Property & {
	primaryPhoto: PropertyPhoto | null
}

export interface ListPropertiesApiResponse {
	data: PropertyListItem[]
	total: number
	limit: number
	offset: number
}

export interface ListPropertiesResponse {
	data: PropertyListItem[]
	total: number
	page: number
	limit: number
	totalPages: number
}
