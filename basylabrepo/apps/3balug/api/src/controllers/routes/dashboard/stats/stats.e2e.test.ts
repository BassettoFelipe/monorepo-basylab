import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET /dashboard/stats - Dashboard Stats E2E', () => {
	const { client, userRepository, companyRepository, planRepository, subscriptionRepository } =
		createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	async function createUserWithSubscription(role: string, planSlug = 'house') {
		const plan = await planRepository.findBySlug(planSlug)
		if (!plan) throw new Error('Plan not found')

		const company = await companyRepository.create({
			name: 'Test Company',
			email: generateTestEmail('company'),
		})

		const owner = await userRepository.create({
			email: generateTestEmail('owner'),
			password: 'hashed-password',
			name: 'Owner User',
			role: 'owner',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		await companyRepository.update(company.id, { ownerId: owner.id })

		await subscriptionRepository.create({
			userId: owner.id,
			planId: plan.id,
			status: 'active',
			startDate: new Date(),
		})

		let user = owner
		if (role !== 'owner') {
			user = await userRepository.create({
				email: generateTestEmail(role),
				password: 'hashed-password',
				name: `${role} User`,
				role,
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
				createdBy: owner.id,
			})
		}

		const token = await JwtUtils.generateToken(user.id, 'access', {
			role: user.role,
			companyId: company.id,
		})

		return { user, owner, company, plan, token }
	}

	describe('Authentication & Authorization', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client.api.dashboard.stats.get()

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.api.dashboard.stats.get({
				headers: {
					Authorization: 'Bearer invalid-token',
				},
			})

			expect(status).toBe(401)
		})

		it('should allow OWNER to get dashboard stats', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api.dashboard.stats.get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})
	})

	describe('Response Structure', () => {
		it('should return complete stats structure', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api.dashboard.stats.get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data).toBeDefined()

			// Verify properties stats
			expect(data?.data.properties).toBeDefined()
			expect(typeof data?.data.properties.total).toBe('number')
			expect(typeof data?.data.properties.available).toBe('number')
			expect(typeof data?.data.properties.rented).toBe('number')
			expect(typeof data?.data.properties.sold).toBe('number')
			expect(typeof data?.data.properties.maintenance).toBe('number')

			// Verify contracts stats
			expect(data?.data.contracts).toBeDefined()
			expect(typeof data?.data.contracts.total).toBe('number')
			expect(typeof data?.data.contracts.active).toBe('number')
			expect(typeof data?.data.contracts.terminated).toBe('number')
			expect(typeof data?.data.contracts.cancelled).toBe('number')
			expect(typeof data?.data.contracts.expired).toBe('number')
			expect(typeof data?.data.contracts.totalRentalAmount).toBe('number')

			// Verify property owners stats
			expect(data?.data.propertyOwners).toBeDefined()
			expect(typeof data?.data.propertyOwners.total).toBe('number')

			// Verify tenants stats
			expect(data?.data.tenants).toBeDefined()
			expect(typeof data?.data.tenants.total).toBe('number')

			// Verify expiring contracts array
			expect(data?.data.expiringContracts).toBeDefined()
			expect(Array.isArray(data?.data.expiringContracts)).toBe(true)
		})

		it('should return zero counts for empty company', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api.dashboard.stats.get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.properties.total).toBe(0)
			expect(data?.data.contracts.total).toBe(0)
			expect(data?.data.propertyOwners.total).toBe(0)
			expect(data?.data.tenants.total).toBe(0)
			expect(data?.data.expiringContracts.length).toBe(0)
		})
	})
})
