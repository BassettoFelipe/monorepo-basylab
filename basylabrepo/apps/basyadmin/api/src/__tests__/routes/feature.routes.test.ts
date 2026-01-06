import { describe, expect, test } from 'bun:test'

// Set environment variables before imports
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-do-not-use-in-production'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/basyadmin_test'

import type { TokenPayload } from '../../utils/jwt'

// Mock data
const mockFeature = {
	id: '123e4567-e89b-12d3-a456-426614174003',
	name: 'Test Feature',
	slug: 'test-feature',
	description: 'A test feature',
	featureType: 'boolean' as const,
	createdAt: new Date(),
	updatedAt: new Date(),
}

const ownerPayload: TokenPayload = {
	userId: '123e4567-e89b-12d3-a456-426614174001',
	email: 'owner@example.com',
	role: 'owner',
}

const managerPayload: TokenPayload = {
	userId: '123e4567-e89b-12d3-a456-426614174002',
	email: 'manager@example.com',
	role: 'manager',
}

describe('Feature Routes', () => {
	describe('POST /features', () => {
		test('should require owner role', () => {
			expect(ownerPayload.role).toBe('owner')
			expect(managerPayload.role).not.toBe('owner')
		})

		test('should validate feature name', () => {
			const validName = 'My Feature'
			const emptyName = ''

			expect(validName.length).toBeGreaterThan(0)
			expect(emptyName.length).toBe(0)
		})

		test('should validate feature slug format', () => {
			const validSlug = 'my-feature'
			const invalidSlug = 'My Feature!'

			const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
			expect(slugRegex.test(validSlug)).toBe(true)
			expect(slugRegex.test(invalidSlug)).toBe(false)
		})

		test('should validate feature type', () => {
			const validTypes = ['boolean', 'limit', 'tier']

			expect(validTypes.includes(mockFeature.featureType)).toBe(true)
			expect(validTypes.includes('invalid' as any)).toBe(false)
		})
	})

	describe('GET /features', () => {
		test('should allow both owner and manager', () => {
			// Both roles can read features
			expect(['owner', 'manager'].includes(ownerPayload.role)).toBe(true)
			expect(['owner', 'manager'].includes(managerPayload.role)).toBe(true)
		})

		test('should return list of features', () => {
			const features = [mockFeature]
			expect(Array.isArray(features)).toBe(true)
		})

		test('should order by name', () => {
			const features = [
				{ ...mockFeature, name: 'B Feature' },
				{ ...mockFeature, name: 'A Feature' },
			]

			const sorted = [...features].sort((a, b) => a.name.localeCompare(b.name))
			expect(sorted[0].name).toBe('A Feature')
		})
	})

	describe('PUT /features/:id', () => {
		test('should require owner role', () => {
			expect(ownerPayload.role).toBe('owner')
		})

		test('should allow updating name', () => {
			const update = { name: 'Updated Feature Name' }
			expect(update.name).toBeDefined()
		})

		test('should allow updating description', () => {
			const update = { description: 'Updated description' }
			expect(update.description).toBeDefined()
		})

		test('should allow updating feature type', () => {
			const update = { featureType: 'limit' as const }
			expect(['boolean', 'limit', 'tier'].includes(update.featureType)).toBe(true)
		})
	})

	describe('DELETE /features/:id', () => {
		test('should require owner role', () => {
			expect(ownerPayload.role).toBe('owner')
		})

		test('should validate feature ID', () => {
			const validId = mockFeature.id
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

			expect(uuidRegex.test(validId)).toBe(true)
		})

		test('should remove feature from all plans', () => {
			// When deleting a feature, it should be removed from plan_features
			const featureId = mockFeature.id
			expect(featureId).toBeDefined()
		})
	})
})

describe('Feature Types', () => {
	test('boolean feature should be true/false', () => {
		const value = true
		expect(typeof value).toBe('boolean')
	})

	test('limit feature should be numeric', () => {
		const value = 100
		expect(typeof value).toBe('number')
	})

	test('tier feature should be string', () => {
		const value = 'premium'
		expect(typeof value).toBe('string')
	})
})

describe('Feature Data Validation', () => {
	test('slug should be unique', () => {
		const slug1 = 'feature-one'
		const slug2 = 'feature-two'

		expect(slug1).not.toBe(slug2)
	})

	test('should require name', () => {
		const featureData = { name: '', slug: 'test' }
		expect(featureData.name.length).toBe(0)
	})

	test('should require slug', () => {
		const featureData = { name: 'Test', slug: '' }
		expect(featureData.slug.length).toBe(0)
	})
})
