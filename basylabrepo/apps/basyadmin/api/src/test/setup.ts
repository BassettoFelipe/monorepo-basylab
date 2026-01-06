import { treaty } from '@elysiajs/eden'
import { injectTestRepositories } from '@/container'
import type { App } from '@/server'
import { app } from '@/server'
import {
	InMemoryBillingRepository,
	InMemoryEventRepository,
	InMemoryFeatureRepository,
	InMemoryPlanRepository,
	InMemoryTenantRepository,
	InMemoryTicketRepository,
	InMemoryUserRepository,
} from './in-memory-repositories'

// Repository instances
let userRepository: InMemoryUserRepository | null = null
let tenantRepository: InMemoryTenantRepository | null = null
let featureRepository: InMemoryFeatureRepository | null = null
let planRepository: InMemoryPlanRepository | null = null
let eventRepository: InMemoryEventRepository | null = null
let billingRepository: InMemoryBillingRepository | null = null
let ticketRepository: InMemoryTicketRepository | null = null

// Getters for repositories
export function getUserRepository(): InMemoryUserRepository {
	if (!userRepository) {
		userRepository = new InMemoryUserRepository()
	}
	return userRepository
}

export function getTenantRepository(): InMemoryTenantRepository {
	if (!tenantRepository) {
		tenantRepository = new InMemoryTenantRepository()
	}
	return tenantRepository
}

export function getFeatureRepository(): InMemoryFeatureRepository {
	if (!featureRepository) {
		featureRepository = new InMemoryFeatureRepository()
	}
	return featureRepository
}

export function getPlanRepository(): InMemoryPlanRepository {
	if (!planRepository) {
		planRepository = new InMemoryPlanRepository()
	}
	return planRepository
}

export function getEventRepository(): InMemoryEventRepository {
	if (!eventRepository) {
		eventRepository = new InMemoryEventRepository()
	}
	return eventRepository
}

export function getBillingRepository(): InMemoryBillingRepository {
	if (!billingRepository) {
		billingRepository = new InMemoryBillingRepository()
	}
	return billingRepository
}

export function getTicketRepository(): InMemoryTicketRepository {
	if (!ticketRepository) {
		ticketRepository = new InMemoryTicketRepository()
	}
	return ticketRepository
}

/**
 * Type-safe Eden Treaty client for the application
 */
export type AppClient = ReturnType<typeof treaty<App>>

/**
 * Creates an authenticated Eden Treaty client with pre-set Authorization header.
 */
export function createAuthenticatedClient(token: string): AppClient {
	return treaty<App>(app, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
}

/**
 * Creates an API client with API key header for tenant API routes.
 */
export function createApiKeyClient(apiKey: string): AppClient {
	return treaty<App>(app, {
		headers: {
			'X-API-Key': apiKey,
		},
	})
}

/**
 * Creates the test app with all repositories injected.
 */
export function createTestApp() {
	const testUserRepository = getUserRepository()
	const testTenantRepository = getTenantRepository()
	const testFeatureRepository = getFeatureRepository()
	const testPlanRepository = getPlanRepository()
	const testEventRepository = getEventRepository()
	const testBillingRepository = getBillingRepository()
	const testTicketRepository = getTicketRepository()

	// Wire up repository dependencies
	testPlanRepository.setFeatureRepository(testFeatureRepository)

	// Inject repositories into container
	injectTestRepositories({
		userRepository: testUserRepository,
		tenantRepository: testTenantRepository,
		featureRepository: testFeatureRepository,
		planRepository: testPlanRepository,
		eventRepository: testEventRepository,
		billingRepository: testBillingRepository,
		ticketRepository: testTicketRepository,
	})

	// Create type-safe Eden Treaty client
	const client = treaty<App>(app)

	return {
		app,
		client,
		createAuthenticatedClient,
		createApiKeyClient,
		userRepository: testUserRepository,
		tenantRepository: testTenantRepository,
		featureRepository: testFeatureRepository,
		planRepository: testPlanRepository,
		eventRepository: testEventRepository,
		billingRepository: testBillingRepository,
		ticketRepository: testTicketRepository,
	}
}

/**
 * Clears all test data from repositories.
 */
export function clearTestData() {
	if (userRepository) userRepository.clear()
	if (tenantRepository) tenantRepository.clear()
	if (featureRepository) featureRepository.clear()
	if (planRepository) planRepository.clear()
	if (eventRepository) eventRepository.clear()
	if (billingRepository) billingRepository.clear()
	if (ticketRepository) ticketRepository.clear()
}

/**
 * Resets all repositories (same as clearTestData).
 */
export function resetAllRepositories() {
	clearTestData()
}
