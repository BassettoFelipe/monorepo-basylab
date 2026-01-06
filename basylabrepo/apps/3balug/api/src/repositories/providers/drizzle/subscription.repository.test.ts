import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'
import { USER_ROLES } from '@/types/roles'
import { PlanDrizzleRepository } from './plan.repository'
import { SubscriptionDrizzleRepository } from './subscription.repository'
import { UserDrizzleRepository } from './user.repository'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const connection = postgres(DATABASE_URL)
const db = drizzle(connection, { schema })

const testRunId = Date.now()

describe('SubscriptionDrizzleRepository', () => {
	const subscriptionRepo = new SubscriptionDrizzleRepository(db)
	const planRepo = new PlanDrizzleRepository(db)
	const userRepo = new UserDrizzleRepository(db)

	let testUserId: string
	let testPlanId: string
	let testSubscriptionId: string

	beforeAll(async () => {
		// Cleanup old test data
		await connection`DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%subscription-repo-test-%')`
		await connection`DELETE FROM users WHERE email LIKE '%subscription-repo-test-%'`
		await connection`DELETE FROM plans WHERE slug LIKE 'test-plan-subscription-%'`

		// Create test user
		const hashedPassword = await PasswordUtils.hash('Test@123')
		const user = await userRepo.create({
			email: `subscription-repo-test-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test User',
			role: USER_ROLES.OWNER,
			isActive: true,
		})
		testUserId = user.id

		// Create test plan
		const plan = await planRepo.create({
			name: 'Test Plan',
			slug: `test-plan-subscription-${testRunId}`,
			description: 'Test plan for subscription tests',
			price: 9900,
			durationDays: 30,
			maxUsers: 5,
			maxManagers: 1,
			maxSerasaQueries: 10,
			allowsLateCharges: 1,
			features: ['feature1', 'feature2'],
		})
		testPlanId = plan.id
	})

	afterAll(async () => {
		// Cleanup in reverse order of creation
		if (testUserId) {
			await connection`DELETE FROM subscriptions WHERE user_id = ${testUserId}`
			await connection`DELETE FROM users WHERE id = ${testUserId}`
		}
		if (testPlanId) {
			await connection`DELETE FROM plans WHERE id = ${testPlanId}`
		}
		await connection.end()
	})

	describe('CRUD Operations', () => {
		test('should create a subscription', async () => {
			const startDate = new Date()
			const endDate = new Date()
			endDate.setDate(endDate.getDate() + 30)

			const subscription = await subscriptionRepo.create({
				userId: testUserId,
				planId: testPlanId,
				status: 'active',
				startDate,
				endDate,
			})

			expect(subscription).toBeDefined()
			expect(subscription.id).toBeDefined()
			expect(subscription.userId).toBe(testUserId)
			expect(subscription.planId).toBe(testPlanId)
			expect(subscription.status).toBe('active')

			testSubscriptionId = subscription.id
		})

		test('should find subscription by id', async () => {
			const subscription = await subscriptionRepo.findById(testSubscriptionId)

			expect(subscription).toBeDefined()
			expect(subscription?.id).toBe(testSubscriptionId)
			expect(subscription?.userId).toBe(testUserId)
		})

		test('should return null for non-existent subscription', async () => {
			const subscription = await subscriptionRepo.findById('00000000-0000-0000-0000-000000000000')
			expect(subscription).toBeNull()
		})

		test('should update subscription', async () => {
			const updated = await subscriptionRepo.update(testSubscriptionId, {
				status: 'pending',
			})

			expect(updated).toBeDefined()
			expect(updated?.status).toBe('pending')
		})

		test('should return null when updating non-existent subscription', async () => {
			const updated = await subscriptionRepo.update('00000000-0000-0000-0000-000000000000', {
				status: 'canceled',
			})
			expect(updated).toBeNull()
		})
	})

	describe('Find Operations', () => {
		test('should find subscription by user id', async () => {
			const subscription = await subscriptionRepo.findByUserId(testUserId)

			expect(subscription).toBeDefined()
			expect(subscription?.userId).toBe(testUserId)
		})

		test('should return null when user has no subscription', async () => {
			const subscription = await subscriptionRepo.findByUserId(
				'00000000-0000-0000-0000-000000000000',
			)
			expect(subscription).toBeNull()
		})

		test('should find active subscription by user id', async () => {
			// First update the subscription to active
			await subscriptionRepo.update(testSubscriptionId, { status: 'active' })

			const subscription = await subscriptionRepo.findActiveByUserId(testUserId)

			expect(subscription).toBeDefined()
			expect(subscription?.status).toBe('active')
			expect(subscription?.userId).toBe(testUserId)
		})

		test('should return null when user has no active subscription', async () => {
			// Update subscription to canceled
			await subscriptionRepo.update(testSubscriptionId, { status: 'canceled' })

			const subscription = await subscriptionRepo.findActiveByUserId(testUserId)
			expect(subscription).toBeNull()

			// Restore to active for other tests
			await subscriptionRepo.update(testSubscriptionId, { status: 'active' })
		})
	})

	describe('Current Subscription', () => {
		test('should find current subscription with plan details', async () => {
			const current = await subscriptionRepo.findCurrentByUserId(testUserId)

			expect(current).toBeDefined()
			expect(current?.userId).toBe(testUserId)
			expect(current?.plan).toBeDefined()
			expect(current?.plan.name).toBe('Test Plan')
			expect(current?.computedStatus).toBeDefined()
		})

		test('should compute active status correctly', async () => {
			// Update endDate to future
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 30)
			await subscriptionRepo.update(testSubscriptionId, {
				status: 'active',
				endDate: futureDate,
			})

			const current = await subscriptionRepo.findCurrentByUserId(testUserId)

			expect(current?.computedStatus).toBe('active')
			expect(current?.daysRemaining).toBeGreaterThan(0)
		})

		test('should compute expired status correctly', async () => {
			// Update endDate to past
			const pastDate = new Date()
			pastDate.setDate(pastDate.getDate() - 5)
			await subscriptionRepo.update(testSubscriptionId, {
				status: 'active',
				endDate: pastDate,
			})

			const current = await subscriptionRepo.findCurrentByUserId(testUserId)

			expect(current?.computedStatus).toBe('expired')
		})

		test('should compute pending status correctly', async () => {
			await subscriptionRepo.update(testSubscriptionId, { status: 'pending' })

			const current = await subscriptionRepo.findCurrentByUserId(testUserId)

			expect(current?.computedStatus).toBe('pending')
		})

		test('should compute canceled status correctly', async () => {
			await subscriptionRepo.update(testSubscriptionId, { status: 'canceled' })

			const current = await subscriptionRepo.findCurrentByUserId(testUserId)

			expect(current?.computedStatus).toBe('canceled')
		})

		test('should return null when user has no subscription', async () => {
			const current = await subscriptionRepo.findCurrentByUserId(
				'00000000-0000-0000-0000-000000000000',
			)
			expect(current).toBeNull()
		})
	})

	describe('Delete Operations', () => {
		test('should delete subscription', async () => {
			// Create a new subscription for deletion
			const startDate = new Date()
			const subscription = await subscriptionRepo.create({
				userId: testUserId,
				planId: testPlanId,
				status: 'active',
				startDate,
			})

			const deleted = await subscriptionRepo.delete(subscription.id)
			expect(deleted).toBe(true)

			const found = await subscriptionRepo.findById(subscription.id)
			expect(found).toBeNull()
		})

		test('should return false when deleting non-existent subscription', async () => {
			const deleted = await subscriptionRepo.delete('00000000-0000-0000-0000-000000000000')
			expect(deleted).toBe(false)
		})
	})
})
