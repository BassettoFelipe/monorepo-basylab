import { describe, expect, it } from 'bun:test'

import {
	isValidEnumValue,
	parseBooleanParam,
	parseDateParam,
	parseEnumParam,
	parseNumberParam,
	parseOptionalEnumParam,
	parseOptionalNumberParam,
	parsePropertyFilters,
	parsePropertyOwnerFilters,
	VALID_DOCUMENT_TYPES,
	VALID_LISTING_TYPES,
	VALID_PROPERTY_OWNER_SORT_BY,
	VALID_PROPERTY_SORT_BY,
	VALID_PROPERTY_STATUSES,
	VALID_PROPERTY_TYPES,
	VALID_SORT_ORDERS,
} from '../url-params'

describe('URL Params Utilities', () => {
	describe('isValidEnumValue', () => {
		it('should return true for valid enum value', () => {
			expect(isValidEnumValue('house', VALID_PROPERTY_TYPES)).toBe(true)
			expect(isValidEnumValue('apartment', VALID_PROPERTY_TYPES)).toBe(true)
		})

		it('should return false for invalid enum value', () => {
			expect(isValidEnumValue('invalid', VALID_PROPERTY_TYPES)).toBe(false)
		})

		it('should return false for null value', () => {
			expect(isValidEnumValue(null, VALID_PROPERTY_TYPES)).toBe(false)
		})
	})

	describe('parseEnumParam', () => {
		it('should return value if valid', () => {
			expect(parseEnumParam('house', VALID_PROPERTY_TYPES, 'apartment')).toBe('house')
		})

		it('should return default if value is invalid', () => {
			expect(parseEnumParam('invalid', VALID_PROPERTY_TYPES, 'apartment')).toBe('apartment')
		})

		it('should return default if value is null', () => {
			expect(parseEnumParam(null, VALID_PROPERTY_TYPES, 'house')).toBe('house')
		})

		it('should work with all property types', () => {
			for (const type of VALID_PROPERTY_TYPES) {
				expect(parseEnumParam(type, VALID_PROPERTY_TYPES, 'house')).toBe(type)
			}
		})

		it('should work with sort orders', () => {
			expect(parseEnumParam('asc', VALID_SORT_ORDERS, 'desc')).toBe('asc')
			expect(parseEnumParam('desc', VALID_SORT_ORDERS, 'asc')).toBe('desc')
		})
	})

	describe('parseOptionalEnumParam', () => {
		it('should return value if valid', () => {
			expect(parseOptionalEnumParam('rent', VALID_LISTING_TYPES)).toBe('rent')
		})

		it('should return undefined for empty string', () => {
			expect(parseOptionalEnumParam('', VALID_LISTING_TYPES)).toBeUndefined()
		})

		it('should return undefined for null', () => {
			expect(parseOptionalEnumParam(null, VALID_LISTING_TYPES)).toBeUndefined()
		})

		it('should return undefined for invalid value', () => {
			expect(parseOptionalEnumParam('invalid', VALID_LISTING_TYPES)).toBeUndefined()
		})

		it('should work with all listing types', () => {
			for (const type of VALID_LISTING_TYPES) {
				expect(parseOptionalEnumParam(type, VALID_LISTING_TYPES)).toBe(type)
			}
		})

		it('should work with all property statuses', () => {
			for (const status of VALID_PROPERTY_STATUSES) {
				expect(parseOptionalEnumParam(status, VALID_PROPERTY_STATUSES)).toBe(status)
			}
		})
	})

	describe('parseNumberParam', () => {
		it('should return parsed number for valid string', () => {
			expect(parseNumberParam('42', 0)).toBe(42)
		})

		it('should return default for null', () => {
			expect(parseNumberParam(null, 10)).toBe(10)
		})

		it('should return default for empty string', () => {
			expect(parseNumberParam('', 5)).toBe(5)
		})

		it('should return default for NaN', () => {
			expect(parseNumberParam('abc', 1)).toBe(1)
		})

		it('should respect min option', () => {
			expect(parseNumberParam('5', 10, { min: 10 })).toBe(10)
			expect(parseNumberParam('15', 10, { min: 10 })).toBe(15)
		})

		it('should respect max option', () => {
			expect(parseNumberParam('100', 10, { max: 50 })).toBe(10)
			expect(parseNumberParam('30', 10, { max: 50 })).toBe(30)
		})

		it('should respect both min and max options', () => {
			expect(parseNumberParam('5', 10, { min: 10, max: 100 })).toBe(10)
			expect(parseNumberParam('150', 10, { min: 10, max: 100 })).toBe(10)
			expect(parseNumberParam('50', 10, { min: 10, max: 100 })).toBe(50)
		})

		it('should handle negative numbers', () => {
			expect(parseNumberParam('-5', 0)).toBe(-5)
		})

		it('should handle decimal numbers', () => {
			expect(parseNumberParam('3.14', 0)).toBe(3.14)
		})
	})

	describe('parseOptionalNumberParam', () => {
		it('should return parsed number for valid string', () => {
			expect(parseOptionalNumberParam('42')).toBe(42)
		})

		it('should return undefined for null', () => {
			expect(parseOptionalNumberParam(null)).toBeUndefined()
		})

		it('should return undefined for empty string', () => {
			expect(parseOptionalNumberParam('')).toBeUndefined()
		})

		it('should return undefined for NaN', () => {
			expect(parseOptionalNumberParam('abc')).toBeUndefined()
		})

		it('should respect min option', () => {
			expect(parseOptionalNumberParam('5', { min: 10 })).toBeUndefined()
			expect(parseOptionalNumberParam('15', { min: 10 })).toBe(15)
		})

		it('should respect max option', () => {
			expect(parseOptionalNumberParam('100', { max: 50 })).toBeUndefined()
			expect(parseOptionalNumberParam('30', { max: 50 })).toBe(30)
		})
	})

	describe('parseBooleanParam', () => {
		it('should return true for "true" string', () => {
			expect(parseBooleanParam('true')).toBe(true)
		})

		it('should return false for "false" string', () => {
			expect(parseBooleanParam('false')).toBe(false)
		})

		it('should return undefined for null', () => {
			expect(parseBooleanParam(null)).toBeUndefined()
		})

		it('should return undefined for other strings', () => {
			expect(parseBooleanParam('yes')).toBeUndefined()
			expect(parseBooleanParam('1')).toBeUndefined()
			expect(parseBooleanParam('')).toBeUndefined()
		})
	})

	describe('parseDateParam', () => {
		it('should return valid ISO date string', () => {
			const date = '2024-01-15T10:30:00.000Z'
			expect(parseDateParam(date)).toBe(date)
		})

		it('should return valid date-only string', () => {
			const date = '2024-01-15'
			expect(parseDateParam(date)).toBe(date)
		})

		it('should return undefined for null', () => {
			expect(parseDateParam(null)).toBeUndefined()
		})

		it('should return undefined for empty string', () => {
			expect(parseDateParam('')).toBeUndefined()
		})

		it('should return undefined for invalid date', () => {
			expect(parseDateParam('invalid-date')).toBeUndefined()
		})
	})

	describe('parsePropertyFilters', () => {
		it('should parse all property filters correctly', () => {
			const params = new URLSearchParams({
				search: 'casa',
				type: 'house',
				status: 'available',
				listingType: 'rent',
				state: 'SP',
				city: 'Sao Paulo',
				minBedrooms: '2',
				maxBedrooms: '4',
				sortBy: 'rentalPrice',
				sortOrder: 'desc',
				page: '2',
			})

			const filters = parsePropertyFilters(params)

			expect(filters.search).toBe('casa')
			expect(filters.type).toBe('house')
			expect(filters.status).toBe('available')
			expect(filters.listingType).toBe('rent')
			expect(filters.state).toBe('SP')
			expect(filters.city).toBe('Sao Paulo')
			expect(filters.minBedrooms).toBe(2)
			expect(filters.maxBedrooms).toBe(4)
			expect(filters.sortBy).toBe('rentalPrice')
			expect(filters.sortOrder).toBe('desc')
			expect(filters.page).toBe(2)
		})

		it('should return defaults for missing params', () => {
			const params = new URLSearchParams()
			const filters = parsePropertyFilters(params)

			expect(filters.search).toBeUndefined()
			expect(filters.type).toBeUndefined()
			expect(filters.status).toBeUndefined()
			expect(filters.listingType).toBeUndefined()
			expect(filters.sortBy).toBe('title')
			expect(filters.sortOrder).toBe('asc')
			expect(filters.page).toBe(1)
		})

		it('should ignore invalid enum values', () => {
			const params = new URLSearchParams({
				type: 'invalid',
				status: 'invalid',
				sortBy: 'invalid',
			})

			const filters = parsePropertyFilters(params)

			expect(filters.type).toBeUndefined()
			expect(filters.status).toBeUndefined()
			expect(filters.sortBy).toBe('title') // default
		})

		it('should handle negative bedroom values', () => {
			const params = new URLSearchParams({
				minBedrooms: '-1',
				maxBedrooms: '-2',
			})

			const filters = parsePropertyFilters(params)

			expect(filters.minBedrooms).toBeUndefined()
			expect(filters.maxBedrooms).toBeUndefined()
		})
	})

	describe('parsePropertyOwnerFilters', () => {
		it('should parse all property owner filters correctly', () => {
			const params = new URLSearchParams({
				search: 'joao',
				documentType: 'cpf',
				state: 'SP',
				city: 'Sao Paulo',
				hasProperties: 'true',
				hasEmail: 'false',
				hasPhone: 'true',
				createdAtStart: '2024-01-01',
				createdAtEnd: '2024-12-31',
				sortBy: 'propertiesCount',
				sortOrder: 'desc',
				page: '3',
			})

			const filters = parsePropertyOwnerFilters(params)

			expect(filters.search).toBe('joao')
			expect(filters.documentType).toBe('cpf')
			expect(filters.state).toBe('SP')
			expect(filters.city).toBe('Sao Paulo')
			expect(filters.hasProperties).toBe(true)
			expect(filters.hasEmail).toBe(false)
			expect(filters.hasPhone).toBe(true)
			expect(filters.createdAtStart).toBe('2024-01-01')
			expect(filters.createdAtEnd).toBe('2024-12-31')
			expect(filters.sortBy).toBe('propertiesCount')
			expect(filters.sortOrder).toBe('desc')
			expect(filters.page).toBe(3)
		})

		it('should return defaults for missing params', () => {
			const params = new URLSearchParams()
			const filters = parsePropertyOwnerFilters(params)

			expect(filters.search).toBeUndefined()
			expect(filters.documentType).toBeUndefined()
			expect(filters.hasProperties).toBeUndefined()
			expect(filters.sortBy).toBe('name')
			expect(filters.sortOrder).toBe('asc')
			expect(filters.page).toBe(1)
		})

		it('should validate document type', () => {
			const validParams = new URLSearchParams({ documentType: 'cnpj' })
			const invalidParams = new URLSearchParams({ documentType: 'invalid' })

			expect(parsePropertyOwnerFilters(validParams).documentType).toBe('cnpj')
			expect(parsePropertyOwnerFilters(invalidParams).documentType).toBeUndefined()
		})

		it('should validate sort by values', () => {
			for (const sortBy of VALID_PROPERTY_OWNER_SORT_BY) {
				const params = new URLSearchParams({ sortBy })
				expect(parsePropertyOwnerFilters(params).sortBy).toBe(sortBy)
			}
		})
	})

	describe('Constant arrays', () => {
		it('should have valid property types', () => {
			expect(VALID_PROPERTY_TYPES).toContain('house')
			expect(VALID_PROPERTY_TYPES).toContain('apartment')
			expect(VALID_PROPERTY_TYPES).toContain('land')
			expect(VALID_PROPERTY_TYPES).toContain('commercial')
			expect(VALID_PROPERTY_TYPES).toContain('rural')
		})

		it('should have valid listing types', () => {
			expect(VALID_LISTING_TYPES).toContain('rent')
			expect(VALID_LISTING_TYPES).toContain('sale')
			expect(VALID_LISTING_TYPES).toContain('both')
		})

		it('should have valid property statuses', () => {
			expect(VALID_PROPERTY_STATUSES).toContain('available')
			expect(VALID_PROPERTY_STATUSES).toContain('rented')
			expect(VALID_PROPERTY_STATUSES).toContain('sold')
			expect(VALID_PROPERTY_STATUSES).toContain('maintenance')
			expect(VALID_PROPERTY_STATUSES).toContain('unavailable')
		})

		it('should have valid document types', () => {
			expect(VALID_DOCUMENT_TYPES).toContain('cpf')
			expect(VALID_DOCUMENT_TYPES).toContain('cnpj')
		})

		it('should have valid sort orders', () => {
			expect(VALID_SORT_ORDERS).toContain('asc')
			expect(VALID_SORT_ORDERS).toContain('desc')
		})

		it('should have valid property sort by options', () => {
			expect(VALID_PROPERTY_SORT_BY).toContain('title')
			expect(VALID_PROPERTY_SORT_BY).toContain('createdAt')
			expect(VALID_PROPERTY_SORT_BY).toContain('rentalPrice')
			expect(VALID_PROPERTY_SORT_BY).toContain('salePrice')
			expect(VALID_PROPERTY_SORT_BY).toContain('city')
			expect(VALID_PROPERTY_SORT_BY).toContain('area')
		})

		it('should have valid property owner sort by options', () => {
			expect(VALID_PROPERTY_OWNER_SORT_BY).toContain('name')
			expect(VALID_PROPERTY_OWNER_SORT_BY).toContain('createdAt')
			expect(VALID_PROPERTY_OWNER_SORT_BY).toContain('propertiesCount')
			expect(VALID_PROPERTY_OWNER_SORT_BY).toContain('city')
			expect(VALID_PROPERTY_OWNER_SORT_BY).toContain('state')
		})
	})
})
