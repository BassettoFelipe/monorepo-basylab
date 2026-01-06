/**
 * Database mock utilities for unit tests
 */

import { mock } from 'bun:test'

// Mock tenant data
export const mockTenant = {
	id: '123e4567-e89b-12d3-a456-426614174000',
	name: 'Test Tenant',
	slug: 'test-tenant',
	logoUrl: null,
	domain: 'test.example.com',
	description: 'A test tenant',
	apiKey: 'test-api-key-12345',
	apiKeyCreatedAt: new Date(),
	settings: {},
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
}

// Mock user data
export const mockOwner = {
	id: '123e4567-e89b-12d3-a456-426614174001',
	email: 'owner@example.com',
	passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S8/GvMPYrJx1Vu',
	name: 'Test Owner',
	role: 'owner' as const,
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
}

export const mockManager = {
	id: '123e4567-e89b-12d3-a456-426614174002',
	email: 'manager@example.com',
	passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S8/GvMPYrJx1Vu',
	name: 'Test Manager',
	role: 'manager' as const,
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
}

// Mock feature data
export const mockFeature = {
	id: '123e4567-e89b-12d3-a456-426614174003',
	name: 'Test Feature',
	slug: 'test-feature',
	description: 'A test feature',
	featureType: 'boolean' as const,
	createdAt: new Date(),
	updatedAt: new Date(),
}

// Mock plan data
export const mockPlan = {
	id: '123e4567-e89b-12d3-a456-426614174004',
	tenantId: mockTenant.id,
	name: 'Basic Plan',
	slug: 'basic',
	description: 'Basic plan description',
	priceCents: 9900,
	currency: 'BRL',
	billingInterval: 'monthly' as const,
	isActive: true,
	displayOrder: 0,
	createdAt: new Date(),
	updatedAt: new Date(),
}

// Mock ticket data
export const mockTicket = {
	id: '123e4567-e89b-12d3-a456-426614174005',
	tenantId: mockTenant.id,
	externalUserId: 'ext-user-123',
	externalUserEmail: 'user@external.com',
	title: 'Test Ticket',
	description: 'Test ticket description',
	priority: 'medium' as const,
	status: 'open' as const,
	category: 'support',
	metadata: {},
	assignedTo: null,
	resolvedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
}

// Mock ticket message data
export const mockTicketMessage = {
	id: '123e4567-e89b-12d3-a456-426614174006',
	ticketId: mockTicket.id,
	senderType: 'user' as const,
	senderId: 'ext-user-123',
	content: 'This is a test message',
	attachments: [],
	createdAt: new Date(),
}

// Mock event data
export const mockEvent = {
	id: '123e4567-e89b-12d3-a456-426614174007',
	tenantId: mockTenant.id,
	eventName: 'user.login',
	userId: 'user-123',
	properties: { browser: 'Chrome' },
	createdAt: new Date(),
}

// Mock billing record data
export const mockBillingRecord = {
	id: '123e4567-e89b-12d3-a456-426614174008',
	tenantId: mockTenant.id,
	externalCustomerId: 'cus_123',
	customerEmail: 'customer@example.com',
	planSlug: 'basic',
	amountCents: 9900,
	currency: 'BRL',
	status: 'paid' as const,
	paidAt: new Date(),
	metadata: {},
	createdAt: new Date(),
}

// Create a mock query builder
export function createMockQueryBuilder<T>(data: T | T[] | undefined) {
	return {
		findFirst: mock(() => Promise.resolve(Array.isArray(data) ? data[0] : data)),
		findMany: mock(() => Promise.resolve(Array.isArray(data) ? data : data ? [data] : [])),
	}
}

// Create mock db object
export function createMockDb() {
	return {
		query: {
			tenants: createMockQueryBuilder(mockTenant),
			users: createMockQueryBuilder(mockOwner),
			features: createMockQueryBuilder(mockFeature),
			plans: createMockQueryBuilder(mockPlan),
			tickets: createMockQueryBuilder(mockTicket),
			ticketMessages: createMockQueryBuilder(mockTicketMessage),
			events: createMockQueryBuilder(mockEvent),
			billingRecords: createMockQueryBuilder(mockBillingRecord),
			userTenants: createMockQueryBuilder({ userId: mockManager.id, tenantId: mockTenant.id }),
			planFeatures: createMockQueryBuilder({ planId: mockPlan.id, featureId: mockFeature.id }),
		},
		insert: mock(() => ({
			values: mock(() => ({
				returning: mock(() => Promise.resolve([mockTenant])),
				onConflictDoNothing: mock(() => Promise.resolve()),
				onConflictDoUpdate: mock(() => Promise.resolve()),
			})),
		})),
		update: mock(() => ({
			set: mock(() => ({
				where: mock(() => ({
					returning: mock(() => Promise.resolve([mockTenant])),
				})),
			})),
		})),
		delete: mock(() => ({
			where: mock(() => Promise.resolve()),
		})),
		select: mock(() => ({
			from: mock(() => ({
				where: mock(() => ({
					groupBy: mock(() => ({
						orderBy: mock(() => Promise.resolve([])),
					})),
				})),
				innerJoin: mock(() => ({
					where: mock(() => ({
						orderBy: mock(() => Promise.resolve([])),
					})),
				})),
			})),
		})),
	}
}
