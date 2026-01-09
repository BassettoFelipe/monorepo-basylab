import { describe, expect, it } from 'bun:test'

import {
	createPropertySchema,
	editPropertySchema,
	propertyBaseSchema,
	propertyFeaturesSchema,
} from '../property.schema'

// Helper to create a valid base property data
const createValidBaseData = (overrides = {}) => ({
	ownerId: 'owner-123',
	type: 'house' as const,
	listingType: 'rent' as const,
	title: 'Casa Exemplo',
	address: 'Rua Teste',
	addressNumber: '123',
	neighborhood: 'Centro',
	city: 'Sao Paulo',
	state: 'SP',
	rentalPrice: 'R$ 1.500,00',
	...overrides,
})

describe('Property Schema', () => {
	describe('propertyFeaturesSchema', () => {
		it('should accept all boolean features', () => {
			const data = {
				hasPool: true,
				hasGarden: false,
				hasGarage: true,
				hasElevator: false,
				hasGym: true,
				hasPlayground: false,
				hasSecurity: true,
				hasAirConditioning: false,
				hasFurnished: true,
				hasPetFriendly: false,
				hasBalcony: true,
				hasBarbecue: false,
			}

			const result = propertyFeaturesSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should accept empty object', () => {
			const result = propertyFeaturesSchema.safeParse({})
			expect(result.success).toBe(true)
		})

		it('should accept partial features', () => {
			const result = propertyFeaturesSchema.safeParse({
				hasPool: true,
				hasGarden: false,
			})
			expect(result.success).toBe(true)
		})
	})

	describe('propertyBaseSchema', () => {
		it('should validate a complete valid property', () => {
			const data = createValidBaseData()
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should require ownerId', () => {
			const data = createValidBaseData({ ownerId: '' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('ownerId')
			}
		})

		it('should require valid property type', () => {
			const data = createValidBaseData({ type: 'invalid' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should accept all valid property types', () => {
			const types = ['house', 'apartment', 'land', 'commercial', 'rural'] as const
			for (const type of types) {
				const data = createValidBaseData({ type })
				const result = propertyBaseSchema.safeParse(data)
				expect(result.success).toBe(true)
			}
		})

		it('should require valid listing type', () => {
			const data = createValidBaseData({ listingType: 'invalid' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should accept all valid listing types', () => {
			const listingTypes = ['rent', 'sale', 'both'] as const
			for (const listingType of listingTypes) {
				const data = createValidBaseData({
					listingType,
					rentalPrice: listingType !== 'sale' ? 'R$ 1.500,00' : undefined,
					salePrice: listingType !== 'rent' ? 'R$ 500.000,00' : undefined,
				})
				const result = propertyBaseSchema.safeParse(data)
				expect(result.success).toBe(true)
			}
		})

		it('should require title with minimum 3 characters', () => {
			const data = createValidBaseData({ title: 'ab' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('title')
			}
		})

		it('should reject title with more than 200 characters', () => {
			const data = createValidBaseData({ title: 'a'.repeat(201) })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('title')
			}
		})

		it('should require address', () => {
			const data = createValidBaseData({ address: '' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should require addressNumber', () => {
			const data = createValidBaseData({ addressNumber: '' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should require neighborhood', () => {
			const data = createValidBaseData({ neighborhood: '' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should require city', () => {
			const data = createValidBaseData({ city: '' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should require state', () => {
			const data = createValidBaseData({ state: '' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should reject state with more than 2 characters', () => {
			const data = createValidBaseData({ state: 'SAO' })
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('state')
			}
		})

		it('should accept optional fields as undefined', () => {
			const data = createValidBaseData({
				description: undefined,
				bedrooms: undefined,
				bathrooms: undefined,
				zipCode: undefined,
				addressComplement: undefined,
			})
			const result = propertyBaseSchema.safeParse(data)
			expect(result.success).toBe(true)
		})
	})

	describe('createPropertySchema - Price Validation', () => {
		it('should require rentalPrice when listingType is rent', () => {
			const data = createValidBaseData({
				listingType: 'rent',
				rentalPrice: '',
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const rentalPriceError = result.error.issues.find((issue) =>
					issue.path.includes('rentalPrice'),
				)
				expect(rentalPriceError).toBeDefined()
			}
		})

		it('should accept valid rentalPrice when listingType is rent', () => {
			const data = createValidBaseData({
				listingType: 'rent',
				rentalPrice: 'R$ 2.500,00',
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should require salePrice when listingType is sale', () => {
			const data = createValidBaseData({
				listingType: 'sale',
				salePrice: '',
				rentalPrice: undefined,
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const salePriceError = result.error.issues.find((issue) => issue.path.includes('salePrice'))
				expect(salePriceError).toBeDefined()
			}
		})

		it('should accept valid salePrice when listingType is sale', () => {
			const data = createValidBaseData({
				listingType: 'sale',
				salePrice: 'R$ 500.000,00',
				rentalPrice: undefined,
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should require both prices when listingType is both', () => {
			const data = createValidBaseData({
				listingType: 'both',
				rentalPrice: '',
				salePrice: '',
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should accept both prices when listingType is both', () => {
			const data = createValidBaseData({
				listingType: 'both',
				rentalPrice: 'R$ 2.500,00',
				salePrice: 'R$ 500.000,00',
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should reject zero rentalPrice', () => {
			const data = createValidBaseData({
				listingType: 'rent',
				rentalPrice: 'R$ 0,00',
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should reject zero salePrice', () => {
			const data = createValidBaseData({
				listingType: 'sale',
				salePrice: 'R$ 0,00',
				rentalPrice: undefined,
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should not require rentalPrice when listingType is sale', () => {
			const data = createValidBaseData({
				listingType: 'sale',
				salePrice: 'R$ 500.000,00',
				rentalPrice: undefined,
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(true)
		})

		it('should not require salePrice when listingType is rent', () => {
			const data = createValidBaseData({
				listingType: 'rent',
				rentalPrice: 'R$ 2.500,00',
				salePrice: undefined,
			})
			const result = createPropertySchema.safeParse(data)
			expect(result.success).toBe(true)
		})
	})

	describe('editPropertySchema', () => {
		it('should require status field', () => {
			const data = createValidBaseData()
			const result = editPropertySchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should accept valid status values', () => {
			const statuses = ['available', 'rented', 'sold', 'maintenance', 'unavailable'] as const
			for (const status of statuses) {
				const data = createValidBaseData({ status })
				const result = editPropertySchema.safeParse(data)
				expect(result.success).toBe(true)
			}
		})

		it('should reject invalid status', () => {
			const data = createValidBaseData({ status: 'invalid' })
			const result = editPropertySchema.safeParse(data)
			expect(result.success).toBe(false)
		})

		it('should apply same price validation as createPropertySchema', () => {
			const data = createValidBaseData({
				status: 'available',
				listingType: 'rent',
				rentalPrice: '',
			})
			const result = editPropertySchema.safeParse(data)
			expect(result.success).toBe(false)
			if (!result.success) {
				const rentalPriceError = result.error.issues.find((issue) =>
					issue.path.includes('rentalPrice'),
				)
				expect(rentalPriceError).toBeDefined()
			}
		})
	})
})
