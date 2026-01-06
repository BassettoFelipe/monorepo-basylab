import { PasswordUtils } from '@basylab/core/crypto'
import type {
	BillingRecord,
	Event,
	Feature,
	NewBillingRecord,
	NewEvent,
	NewFeature,
	NewPlan,
	NewTenant,
	NewTicket,
	NewUser,
	Plan,
	Tenant,
	Ticket,
	User,
} from '@/db/schema'

const generateUUID = (): string => crypto.randomUUID()

// ==================== User Helpers ====================

export async function createTestUser(overrides: Partial<NewUser> = {}): Promise<User> {
	const passwordHash = await PasswordUtils.hash('password123')

	return {
		id: generateUUID(),
		email: `test-${generateUUID().slice(0, 8)}@example.com`,
		passwordHash,
		name: 'Test User',
		role: 'owner',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as User
}

export async function createTestOwner(overrides: Partial<NewUser> = {}): Promise<User> {
	return createTestUser({ ...overrides, role: 'owner' })
}

export async function createTestManager(overrides: Partial<NewUser> = {}): Promise<User> {
	return createTestUser({ ...overrides, role: 'manager' })
}

// ==================== Tenant Helpers ====================

export function createTestTenant(overrides: Partial<NewTenant> = {}): Tenant {
	const id = generateUUID()
	const slug = `tenant-${id.slice(0, 8)}`

	return {
		id,
		name: 'Test Tenant',
		slug,
		logoUrl: null,
		domain: null,
		description: null,
		apiKey: `basy_${generateUUID().replace(/-/g, '')}`,
		apiKeyCreatedAt: new Date(),
		settings: {},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as Tenant
}

// ==================== Feature Helpers ====================

export function createTestFeature(overrides: Partial<NewFeature> = {}): Feature {
	const id = generateUUID()
	const slug = `feature-${id.slice(0, 8)}`

	return {
		id,
		name: 'Test Feature',
		slug,
		description: null,
		featureType: 'boolean',
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as Feature
}

// ==================== Plan Helpers ====================

export function createTestPlan(tenantId: string, overrides: Partial<NewPlan> = {}): Plan {
	const id = generateUUID()
	const slug = `plan-${id.slice(0, 8)}`

	return {
		id,
		tenantId,
		name: 'Test Plan',
		slug,
		description: null,
		priceCents: 9900,
		currency: 'BRL',
		billingInterval: 'monthly',
		isActive: true,
		displayOrder: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as Plan
}

// ==================== Event Helpers ====================

export function createTestEvent(tenantId: string, overrides: Partial<NewEvent> = {}): Event {
	return {
		id: generateUUID(),
		tenantId,
		eventName: 'test_event',
		userId: null,
		properties: {},
		createdAt: new Date(),
		...overrides,
	} as Event
}

// ==================== Billing Helpers ====================

export function createTestBillingRecord(
	tenantId: string,
	overrides: Partial<NewBillingRecord> = {},
): BillingRecord {
	return {
		id: generateUUID(),
		tenantId,
		externalCustomerId: null,
		customerEmail: null,
		planSlug: null,
		amountCents: 9900,
		currency: 'BRL',
		status: 'paid',
		paidAt: new Date(),
		metadata: {},
		createdAt: new Date(),
		...overrides,
	} as BillingRecord
}

// ==================== Ticket Helpers ====================

export function createTestTicket(tenantId: string, overrides: Partial<NewTicket> = {}): Ticket {
	return {
		id: generateUUID(),
		tenantId,
		externalUserId: null,
		externalUserEmail: 'customer@example.com',
		title: 'Test Ticket',
		description: 'Test description',
		priority: 'medium',
		status: 'open',
		category: null,
		metadata: {},
		assignedTo: null,
		resolvedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as Ticket
}

// ==================== JWT Helpers ====================

export type TestUserPayload = {
	userId: string
	email: string
	role: 'owner' | 'manager'
}

export function createTestUserPayload(user: User): TestUserPayload {
	return {
		userId: user.id,
		email: user.email,
		role: user.role,
	}
}
