import { beforeEach, describe, expect, it } from 'bun:test'
import { FIELD_TYPES } from '@/db/schema/custom-fields'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET /custom-fields - List Custom Fields E2E', () => {
	const {
		client,
		userRepository,
		companyRepository,
		planRepository,
		subscriptionRepository,
		customFieldRepository,
	} = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	async function createOwnerWithSubscription(planSlug = 'house') {
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

		const token = await JwtUtils.generateToken(owner.id, 'access', {
			role: 'owner',
			companyId: company.id,
		})

		return { owner, company, plan, token }
	}

	describe('Authentication', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client['custom-fields'].get()

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client['custom-fields'].get({
				headers: {
					Authorization: 'Bearer invalid-token',
				},
			})

			expect(status).toBe(401)
		})
	})

	describe('Successful Listing', () => {
		it('should return empty list when no custom fields exist', async () => {
			const { token } = await createOwnerWithSubscription()

			const { status, data } = await client['custom-fields'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data).toEqual([])
			expect(data?.hasFeature).toBe(true)
		})

		it('should return list of active custom fields', async () => {
			const { token, company } = await createOwnerWithSubscription()

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Texto',
				type: FIELD_TYPES.TEXT,
				isRequired: true,
				order: 0,
				isActive: true,
			})

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Email',
				type: FIELD_TYPES.EMAIL,
				isRequired: false,
				order: 1,
				isActive: true,
			})

			const { status, data } = await client['custom-fields'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data).toHaveLength(2)
			expect(data?.data[0].label).toBe('Campo Texto')
			expect(data?.data[1].label).toBe('Campo Email')
		})

		it('should not return inactive fields by default', async () => {
			const { token, company } = await createOwnerWithSubscription()

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Ativo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Inativo',
				type: FIELD_TYPES.TEXT,
				isActive: false,
				order: 1,
			})

			const { status, data } = await client['custom-fields'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data).toHaveLength(1)
			expect(data?.data[0].label).toBe('Campo Ativo')
		})

		it('should return inactive fields when includeInactive is true', async () => {
			const { token, company } = await createOwnerWithSubscription()

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Ativo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Inativo',
				type: FIELD_TYPES.TEXT,
				isActive: false,
				order: 1,
			})

			const { status, data } = await client['custom-fields'].get({
				query: {
					includeInactive: 'true',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data).toHaveLength(2)
		})

		it('should return fields ordered by order property', async () => {
			const { token, company } = await createOwnerWithSubscription()

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Terceiro',
				type: FIELD_TYPES.TEXT,
				order: 2,
				isActive: true,
			})

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Primeiro',
				type: FIELD_TYPES.TEXT,
				order: 0,
				isActive: true,
			})

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Segundo',
				type: FIELD_TYPES.TEXT,
				order: 1,
				isActive: true,
			})

			const { status, data } = await client['custom-fields'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data[0].label).toBe('Primeiro')
			expect(data?.data[1].label).toBe('Segundo')
			expect(data?.data[2].label).toBe('Terceiro')
		})
	})

	describe('Plan Feature Check', () => {
		it('should return hasFeature false for basic plan', async () => {
			const { token } = await createOwnerWithSubscription('basico')

			const { status, data } = await client['custom-fields'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.hasFeature).toBe(false)
			expect(data?.data).toEqual([])
		})
	})

	describe('Company Isolation', () => {
		it("should only return fields from user's company", async () => {
			const { token, company } = await createOwnerWithSubscription()

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				email: generateTestEmail('other-company'),
			})

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Meu Campo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			await customFieldRepository.create({
				companyId: otherCompany.id,
				label: 'Campo de Outra Empresa',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data).toHaveLength(1)
			expect(data?.data[0].label).toBe('Meu Campo')
		})
	})
})
