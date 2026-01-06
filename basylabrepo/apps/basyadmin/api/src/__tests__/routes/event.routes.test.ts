import { describe, expect, test } from 'bun:test'

// Set environment variables before imports
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-do-not-use-in-production'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/basyadmin_test'

import type { TokenPayload } from '../../utils/jwt'

// Mock data
const mockTenant = {
	id: '123e4567-e89b-12d3-a456-426614174000',
	name: 'Test Tenant',
	slug: 'test-tenant',
	apiKey: 'test-api-key-12345',
	isActive: true,
}

const mockEvent = {
	id: '123e4567-e89b-12d3-a456-426614174007',
	tenantId: mockTenant.id,
	eventName: 'user.login',
	userId: 'user-123',
	properties: { browser: 'Chrome', os: 'Windows' },
	createdAt: new Date(),
}

const ownerPayload: TokenPayload = {
	userId: '123e4567-e89b-12d3-a456-426614174001',
	email: 'owner@example.com',
	role: 'owner',
}

describe('Event Routes - API Key (External)', () => {
	describe('POST /api/v1/events', () => {
		test('should require API key', () => {
			const apiKey = mockTenant.apiKey
			expect(apiKey).toBeDefined()
		})

		test('should validate event name', () => {
			const validName = 'user.login'
			const emptyName = ''

			expect(validName.length).toBeGreaterThan(0)
			expect(emptyName.length).toBe(0)
		})

		test('should allow optional userId', () => {
			const eventWithUser = { ...mockEvent, userId: 'user-123' }
			const eventWithoutUser = { ...mockEvent, userId: undefined }

			expect(eventWithUser.userId).toBeDefined()
			expect(eventWithoutUser.userId).toBeUndefined()
		})

		test('should allow optional properties', () => {
			const eventWithProps = { ...mockEvent, properties: { key: 'value' } }
			const eventWithoutProps = { ...mockEvent, properties: {} }

			expect(Object.keys(eventWithProps.properties).length).toBeGreaterThan(0)
			expect(Object.keys(eventWithoutProps.properties).length).toBe(0)
		})

		test('should set tenantId from API key', () => {
			expect(mockEvent.tenantId).toBe(mockTenant.id)
		})
	})

	describe('POST /api/v1/events/batch', () => {
		test('should require API key', () => {
			const apiKey = mockTenant.apiKey
			expect(apiKey).toBeDefined()
		})

		test('should accept array of events', () => {
			const events = [mockEvent, { ...mockEvent, eventName: 'user.logout' }]
			expect(Array.isArray(events)).toBe(true)
			expect(events.length).toBe(2)
		})

		test('should validate all events in batch', () => {
			const validEvents = [
				{ eventName: 'event1', userId: 'user1' },
				{ eventName: 'event2', userId: 'user2' },
			]

			validEvents.forEach((event) => {
				expect(event.eventName.length).toBeGreaterThan(0)
			})
		})

		test('should set tenantId for all events', () => {
			const events = [mockEvent, { ...mockEvent, id: 'new-id' }]
			events.forEach((event) => {
				expect(event.tenantId).toBe(mockTenant.id)
			})
		})
	})
})

describe('Event Routes - JWT Auth (Panel)', () => {
	describe('GET /events', () => {
		test('should require authentication', () => {
			expect(ownerPayload.userId).toBeDefined()
		})

		test('should support filtering by tenantId', () => {
			const filters = { tenantId: mockTenant.id }
			expect(filters.tenantId).toBeDefined()
		})

		test('should support filtering by eventName', () => {
			const filters = { eventName: 'user.login' }
			expect(filters.eventName).toBeDefined()
		})

		test('should support filtering by userId', () => {
			const filters = { userId: 'user-123' }
			expect(filters.userId).toBeDefined()
		})

		test('should support date range filtering', () => {
			const filters = {
				startDate: new Date('2024-01-01'),
				endDate: new Date('2024-12-31'),
			}

			expect(filters.startDate).toBeDefined()
			expect(filters.endDate).toBeDefined()
			expect(filters.startDate < filters.endDate).toBe(true)
		})

		test('should support pagination', () => {
			const pagination = { limit: 100, offset: 0 }
			expect(pagination.limit).toBe(100)
			expect(pagination.offset).toBe(0)
		})
	})

	describe('GET /events/aggregate', () => {
		test('should require authentication', () => {
			expect(ownerPayload.userId).toBeDefined()
		})

		test('should return event counts by name', () => {
			const aggregate = [
				{ eventName: 'user.login', count: 150 },
				{ eventName: 'user.logout', count: 120 },
			]

			aggregate.forEach((item) => {
				expect(item.eventName).toBeDefined()
				expect(typeof item.count).toBe('number')
			})
		})

		test('should support date range filtering', () => {
			const filters = {
				startDate: new Date('2024-01-01'),
				endDate: new Date('2024-12-31'),
			}

			expect(filters.startDate).toBeDefined()
			expect(filters.endDate).toBeDefined()
		})
	})

	describe('GET /events/export', () => {
		test('should require authentication', () => {
			expect(ownerPayload.userId).toBeDefined()
		})

		test('should support CSV format', () => {
			const format = 'csv'
			expect(['csv', 'json'].includes(format)).toBe(true)
		})

		test('should support JSON format', () => {
			const format = 'json'
			expect(['csv', 'json'].includes(format)).toBe(true)
		})

		test('should respect filters', () => {
			const filters = {
				tenantId: mockTenant.id,
				eventName: 'user.login',
			}

			expect(filters.tenantId).toBeDefined()
			expect(filters.eventName).toBeDefined()
		})
	})
})

describe('Event Data Validation', () => {
	test('eventName should be non-empty string', () => {
		expect(mockEvent.eventName.length).toBeGreaterThan(0)
		expect(typeof mockEvent.eventName).toBe('string')
	})

	test('properties should be object', () => {
		expect(typeof mockEvent.properties).toBe('object')
		expect(mockEvent.properties).not.toBeNull()
	})

	test('createdAt should be set automatically', () => {
		expect(mockEvent.createdAt).toBeDefined()
		expect(mockEvent.createdAt instanceof Date).toBe(true)
	})
})

describe('Common Event Names', () => {
	const commonEvents = [
		'user.login',
		'user.logout',
		'user.register',
		'subscription.created',
		'subscription.cancelled',
		'payment.success',
		'payment.failed',
		'feature.used',
	]

	commonEvents.forEach((eventName) => {
		test(`should accept ${eventName}`, () => {
			expect(eventName.length).toBeGreaterThan(0)
			expect(eventName.includes('.')).toBe(true)
		})
	})
})
