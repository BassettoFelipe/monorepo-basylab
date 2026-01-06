import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('PUT /companies/me - Update Company E2E', () => {
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
			const { status } = await client.api.companies.me.put({
				name: 'Updated Company',
			})

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.api.companies.me.put(
				{
					name: 'Updated Company',
				},
				{
					headers: {
						Authorization: 'Bearer invalid-token',
					},
				},
			)

			expect(status).toBe(401)
		})

		it('should allow OWNER to update company', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api.companies.me.put(
				{
					name: 'Updated Company Name',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})

		it('should deny MANAGER from updating company', async () => {
			const { token } = await createUserWithSubscription('manager')

			const { status } = await client.api.companies.me.put(
				{
					name: 'Updated Company',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(403)
		})

		it('should deny BROKER from updating company', async () => {
			const { token } = await createUserWithSubscription('broker')

			const { status } = await client.api.companies.me.put(
				{
					name: 'Updated Company',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(403)
		})
	})

	describe('Input Validation', () => {
		it('should return 422 when name is too short', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status } = await client.api.companies.me.put(
				{
					name: 'A',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when name is too long', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status } = await client.api.companies.me.put(
				{
					name: 'A'.repeat(101),
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})
	})

	describe('Successful Update', () => {
		it('should update company name successfully', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const { status, data } = await client.api.companies.me.put(
				{
					name: 'New Company Name',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.message).toBe('Empresa atualizada com sucesso')
			expect(data?.data.id).toBe(company.id)
			expect(data?.data.name).toBe('New Company Name')
		})
	})
})
