import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET /companies/me - Get Company E2E', () => {
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
			cnpj: '11222333000181',
			phone: '11999999999',
			address: 'Rua das Flores, 123',
			city: 'São Paulo',
			state: 'SP',
			zipCode: '01234567',
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
			const { status } = await client.api.companies.me.get()

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.api.companies.me.get({
				headers: {
					Authorization: 'Bearer invalid-token',
				},
			})

			expect(status).toBe(401)
		})

		it('should allow OWNER to get company', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api.companies.me.get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})
	})

	describe('Response Data', () => {
		it('should return company data with all fields', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const { status, data } = await client.api.companies.me.get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data.id).toBe(company.id)
			expect(data?.data.name).toBe('Test Company')
			expect(data?.data.cnpj).toBe('11222333000181')
			expect(data?.data.phone).toBe('11999999999')
			expect(data?.data.address).toBe('Rua das Flores, 123')
			expect(data?.data.city).toBe('São Paulo')
			expect(data?.data.state).toBe('SP')
			expect(data?.data.zipCode).toBe('01234567')
		})

		it('should return null for optional fields when not set', async () => {
			const plan = await planRepository.findBySlug('house')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Minimal Company',
				email: generateTestEmail('minimal-company'),
			})

			const owner = await userRepository.create({
				email: generateTestEmail('minimal-owner'),
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

			const token = await JwtUtils.generateToken(owner.id, 'access', {
				role: owner.role,
				companyId: company.id,
			})

			const { status, data } = await client.api.companies.me.get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data.id).toBe(company.id)
			expect(data?.data.name).toBe('Minimal Company')
			expect(data?.data.cnpj).toBeNull()
			expect(data?.data.phone).toBeNull()
			expect(data?.data.address).toBeNull()
			expect(data?.data.city).toBeNull()
			expect(data?.data.state).toBeNull()
			expect(data?.data.zipCode).toBeNull()
		})
	})
})
