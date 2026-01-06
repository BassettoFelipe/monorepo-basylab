import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET /property-owners - List Property Owners E2E', () => {
	const {
		client,
		userRepository,
		companyRepository,
		planRepository,
		subscriptionRepository,
		propertyOwnerRepository,
	} = createTestApp()

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

	async function createPropertyOwner(
		companyId: string,
		createdById: string,
		name: string,
		document: string,
	) {
		return propertyOwnerRepository.create({
			companyId,
			name,
			documentType: 'cpf',
			document,
			phone: '11999999999',
			createdBy: createdById,
		})
	}

	describe('Authentication & Authorization', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client.api['property-owners'].get()

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.api['property-owners'].get({
				headers: {
					Authorization: 'Bearer invalid-token',
				},
			})

			expect(status).toBe(401)
		})

		it('should allow OWNER to list property owners', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})
	})

	describe('Listing', () => {
		it('should return empty list when no property owners exist', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data).toEqual([])
			expect(data?.total).toBe(0)
		})

		it('should return list of property owners', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'João Silva', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Maria Santos', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data.length).toBe(2)
			expect(data?.total).toBe(2)
		})

		it('should only return property owners from the same company', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'João Silva', '12345678909')

			// Create property owner in another company
			const company2 = await companyRepository.create({
				name: 'Other Company',
				email: generateTestEmail('company2'),
			})
			const owner2 = await userRepository.create({
				email: generateTestEmail('owner2'),
				password: 'hashed-password',
				name: 'Owner 2',
				role: 'owner',
				companyId: company2.id,
				isActive: true,
				isEmailVerified: true,
			})
			await createPropertyOwner(company2.id, owner2.id, 'Maria Santos', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('João Silva')
		})
	})

	describe('Search', () => {
		it('should filter property owners by search term', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'João Silva', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Maria Santos', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					search: 'João',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('João Silva')
		})
	})

	describe('Pagination', () => {
		it('should respect limit parameter', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Owner 1', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Owner 2', '52998224725')
			await createPropertyOwner(company.id, owner.id, 'Owner 3', '11144477735')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					limit: 2,
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(2)
			expect(data?.total).toBe(3)
			expect(data?.limit).toBe(2)
		})

		it('should respect offset parameter', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Owner 1', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Owner 2', '52998224725')
			await createPropertyOwner(company.id, owner.id, 'Owner 3', '11144477735')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					offset: 1,
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(2)
			expect(data?.offset).toBe(1)
		})
	})
})
