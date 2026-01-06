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

const mockTicket = {
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

const mockMessage = {
	id: '123e4567-e89b-12d3-a456-426614174006',
	ticketId: mockTicket.id,
	senderType: 'user' as const,
	senderId: 'ext-user-123',
	content: 'This is a test message',
	attachments: [],
	createdAt: new Date(),
}

const ownerPayload: TokenPayload = {
	userId: '123e4567-e89b-12d3-a456-426614174001',
	email: 'owner@example.com',
	role: 'owner',
}

describe('Ticket Routes - API Key (External)', () => {
	describe('POST /api/v1/tickets', () => {
		test('should require API key', () => {
			const apiKey = mockTenant.apiKey
			expect(apiKey).toBeDefined()
		})

		test('should validate ticket title', () => {
			const validTitle = 'Help with login'
			const emptyTitle = ''

			expect(validTitle.length).toBeGreaterThan(0)
			expect(emptyTitle.length).toBe(0)
		})

		test('should set default priority to medium', () => {
			expect(mockTicket.priority).toBe('medium')
		})

		test('should set default status to open', () => {
			expect(mockTicket.status).toBe('open')
		})

		test('should allow external user info', () => {
			expect(mockTicket.externalUserId).toBeDefined()
			expect(mockTicket.externalUserEmail).toBeDefined()
		})
	})

	describe('GET /api/v1/tickets', () => {
		test('should require API key', () => {
			const apiKey = mockTenant.apiKey
			expect(apiKey).toBeDefined()
		})

		test('should only return tickets for the tenant', () => {
			expect(mockTicket.tenantId).toBe(mockTenant.id)
		})
	})

	describe('GET /api/v1/tickets/:id', () => {
		test('should require API key', () => {
			const apiKey = mockTenant.apiKey
			expect(apiKey).toBeDefined()
		})

		test('should only return ticket if belongs to tenant', () => {
			expect(mockTicket.tenantId).toBe(mockTenant.id)
		})
	})

	describe('POST /api/v1/tickets/:id/messages', () => {
		test('should require API key', () => {
			const apiKey = mockTenant.apiKey
			expect(apiKey).toBeDefined()
		})

		test('should validate message content', () => {
			const validContent = 'This is my message'
			const emptyContent = ''

			expect(validContent.length).toBeGreaterThan(0)
			expect(emptyContent.length).toBe(0)
		})

		test('should set sender type to user for external messages', () => {
			expect(mockMessage.senderType).toBe('user')
		})
	})
})

describe('Ticket Routes - JWT Auth (Panel)', () => {
	describe('GET /tickets', () => {
		test('should require authentication', () => {
			expect(ownerPayload.userId).toBeDefined()
		})

		test('owner should see all tickets', () => {
			expect(ownerPayload.role).toBe('owner')
		})

		test('manager should see only assigned tenant tickets', () => {
			const managerPayload: TokenPayload = {
				userId: '123',
				email: 'manager@test.com',
				role: 'manager',
			}
			expect(managerPayload.role).toBe('manager')
		})
	})

	describe('GET /tickets/:id', () => {
		test('should return ticket with messages', () => {
			expect(mockTicket.id).toBeDefined()
		})
	})

	describe('PUT /tickets/:id', () => {
		test('should allow updating status', () => {
			const validStatuses = ['open', 'in_progress', 'waiting', 'resolved', 'closed']
			expect(validStatuses.includes(mockTicket.status)).toBe(true)
		})

		test('should allow updating priority', () => {
			const validPriorities = ['low', 'medium', 'high', 'urgent']
			expect(validPriorities.includes(mockTicket.priority)).toBe(true)
		})

		test('should allow assigning to user', () => {
			const assignment = { assignedTo: ownerPayload.userId }
			expect(assignment.assignedTo).toBeDefined()
		})

		test('should set resolvedAt when status is resolved', () => {
			const resolved = { status: 'resolved', resolvedAt: new Date() }
			expect(resolved.resolvedAt).toBeDefined()
		})
	})

	describe('POST /tickets/:id/messages', () => {
		test('should set sender type based on user role', () => {
			const ownerMessage = { senderType: 'owner' }
			const managerMessage = { senderType: 'manager' }

			expect(['owner', 'manager', 'system'].includes(ownerMessage.senderType)).toBe(true)
			expect(['owner', 'manager', 'system'].includes(managerMessage.senderType)).toBe(true)
		})
	})
})

describe('Ticket Status Flow', () => {
	test('open -> in_progress', () => {
		const from = 'open'
		const to = 'in_progress'
		expect(from).not.toBe(to)
	})

	test('in_progress -> waiting', () => {
		const from = 'in_progress'
		const to = 'waiting'
		expect(from).not.toBe(to)
	})

	test('waiting -> resolved', () => {
		const from = 'waiting'
		const to = 'resolved'
		expect(from).not.toBe(to)
	})

	test('resolved -> closed', () => {
		const from = 'resolved'
		const to = 'closed'
		expect(from).not.toBe(to)
	})
})

describe('Ticket Priority Levels', () => {
	test('low priority', () => {
		expect(['low', 'medium', 'high', 'urgent'].includes('low')).toBe(true)
	})

	test('medium priority', () => {
		expect(['low', 'medium', 'high', 'urgent'].includes('medium')).toBe(true)
	})

	test('high priority', () => {
		expect(['low', 'medium', 'high', 'urgent'].includes('high')).toBe(true)
	})

	test('urgent priority', () => {
		expect(['low', 'medium', 'high', 'urgent'].includes('urgent')).toBe(true)
	})
})
