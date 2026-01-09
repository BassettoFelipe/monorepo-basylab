/**
 * Utility for validating and parsing URL parameters with type safety
 */

/**
 * Validates if a string is a valid value from a union type
 */
export function isValidEnumValue<T extends string>(
	value: string | null,
	validValues: readonly T[],
): value is T {
	return value !== null && validValues.includes(value as T)
}

/**
 * Parse and validate an enum param from URL
 * Returns the default value if the param is invalid or missing
 */
export function parseEnumParam<T extends string>(
	value: string | null,
	validValues: readonly T[],
	defaultValue: T,
): T {
	if (isValidEnumValue(value, validValues)) {
		return value
	}
	return defaultValue
}

/**
 * Parse an optional enum param from URL
 * Returns undefined if empty, the value if valid, or undefined if invalid
 */
export function parseOptionalEnumParam<T extends string>(
	value: string | null,
	validValues: readonly T[],
): T | undefined {
	if (!value || value === '') {
		return undefined
	}
	if (isValidEnumValue(value, validValues)) {
		return value
	}
	return undefined
}

/**
 * Parse a number param from URL
 * Returns the default value if invalid or missing
 */
export function parseNumberParam(
	value: string | null,
	defaultValue: number,
	options?: { min?: number; max?: number },
): number {
	if (!value) return defaultValue

	const num = Number(value)
	if (Number.isNaN(num)) return defaultValue

	if (options?.min !== undefined && num < options.min) return defaultValue
	if (options?.max !== undefined && num > options.max) return defaultValue

	return num
}

/**
 * Parse an optional number param from URL
 */
export function parseOptionalNumberParam(
	value: string | null,
	options?: { min?: number; max?: number },
): number | undefined {
	if (!value) return undefined

	const num = Number(value)
	if (Number.isNaN(num)) return undefined

	if (options?.min !== undefined && num < options.min) return undefined
	if (options?.max !== undefined && num > options.max) return undefined

	return num
}

/**
 * Parse a boolean param from URL (true/false strings)
 */
export function parseBooleanParam(value: string | null): boolean | undefined {
	if (value === 'true') return true
	if (value === 'false') return false
	return undefined
}

/**
 * Parse a date string param from URL
 * Returns undefined if invalid
 */
export function parseDateParam(value: string | null): string | undefined {
	if (!value) return undefined

	// Basic ISO date validation
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return undefined

	return value
}

// Property-specific validators
export const VALID_PROPERTY_TYPES = ['house', 'apartment', 'land', 'commercial', 'rural'] as const
export const VALID_LISTING_TYPES = ['rent', 'sale', 'both'] as const
export const VALID_PROPERTY_STATUSES = [
	'available',
	'rented',
	'sold',
	'maintenance',
	'unavailable',
] as const
export const VALID_PROPERTY_SORT_BY = [
	'title',
	'createdAt',
	'rentalPrice',
	'salePrice',
	'city',
	'area',
] as const
export const VALID_SORT_ORDERS = ['asc', 'desc'] as const

// Property Owner specific validators
export const VALID_DOCUMENT_TYPES = ['cpf', 'cnpj'] as const
export const VALID_PROPERTY_OWNER_SORT_BY = [
	'name',
	'createdAt',
	'propertiesCount',
	'city',
	'state',
] as const

export type PropertyType = (typeof VALID_PROPERTY_TYPES)[number]
export type ListingType = (typeof VALID_LISTING_TYPES)[number]
export type PropertyStatus = (typeof VALID_PROPERTY_STATUSES)[number]
export type PropertySortBy = (typeof VALID_PROPERTY_SORT_BY)[number]
export type SortOrder = (typeof VALID_SORT_ORDERS)[number]
export type DocumentType = (typeof VALID_DOCUMENT_TYPES)[number]
export type PropertyOwnerSortBy = (typeof VALID_PROPERTY_OWNER_SORT_BY)[number]

/**
 * Helper to parse property filters from URL
 */
export function parsePropertyFilters(searchParams: URLSearchParams) {
	return {
		search: searchParams.get('search') || undefined,
		type: parseOptionalEnumParam(searchParams.get('type'), VALID_PROPERTY_TYPES),
		status: parseOptionalEnumParam(searchParams.get('status'), VALID_PROPERTY_STATUSES),
		listingType: parseOptionalEnumParam(searchParams.get('listingType'), VALID_LISTING_TYPES),
		state: searchParams.get('state') || undefined,
		city: searchParams.get('city') || undefined,
		minBedrooms: parseOptionalNumberParam(searchParams.get('minBedrooms'), { min: 0 }),
		maxBedrooms: parseOptionalNumberParam(searchParams.get('maxBedrooms'), { min: 0 }),
		sortBy: parseEnumParam(searchParams.get('sortBy'), VALID_PROPERTY_SORT_BY, 'title'),
		sortOrder: parseEnumParam(searchParams.get('sortOrder'), VALID_SORT_ORDERS, 'asc'),
		page: parseNumberParam(searchParams.get('page'), 1, { min: 1 }),
	}
}

/**
 * Helper to parse property owner filters from URL
 */
export function parsePropertyOwnerFilters(searchParams: URLSearchParams) {
	return {
		search: searchParams.get('search') || undefined,
		documentType: parseOptionalEnumParam(searchParams.get('documentType'), VALID_DOCUMENT_TYPES),
		state: searchParams.get('state') || undefined,
		city: searchParams.get('city') || undefined,
		hasProperties: parseBooleanParam(searchParams.get('hasProperties')),
		hasEmail: parseBooleanParam(searchParams.get('hasEmail')),
		hasPhone: parseBooleanParam(searchParams.get('hasPhone')),
		createdAtStart: parseDateParam(searchParams.get('createdAtStart')),
		createdAtEnd: parseDateParam(searchParams.get('createdAtEnd')),
		sortBy: parseEnumParam(searchParams.get('sortBy'), VALID_PROPERTY_OWNER_SORT_BY, 'name'),
		sortOrder: parseEnumParam(searchParams.get('sortOrder'), VALID_SORT_ORDERS, 'asc'),
		page: parseNumberParam(searchParams.get('page'), 1, { min: 1 }),
	}
}
