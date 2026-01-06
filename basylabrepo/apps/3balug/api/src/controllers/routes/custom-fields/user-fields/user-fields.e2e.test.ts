import { beforeEach, describe, expect, it } from 'bun:test'
import { FIELD_TYPES } from '@/db/schema/custom-fields'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET /custom-fields/user/:targetUserId - User Fields E2E', () => {
	const {
		client,
		userRepository,
		companyRepository,
		planRepository,
		subscriptionRepository,
		customFieldRepository,
		customFieldResponseRepository,
	} = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	async function createCompanyWithUsers(planSlug = 'house') {
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

		const manager = await userRepository.create({
			email: generateTestEmail('manager'),
			password: 'hashed-password',
			name: 'Manager User',
			role: 'manager',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
			createdBy: owner.id,
		})

		const broker = await userRepository.create({
			email: generateTestEmail('broker'),
			password: 'hashed-password',
			name: 'Broker User',
			role: 'broker',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
			createdBy: owner.id,
		})

		const ownerToken = await JwtUtils.generateToken(owner.id, 'access', {
			role: 'owner',
			companyId: company.id,
		})

		const managerToken = await JwtUtils.generateToken(manager.id, 'access', {
			role: 'manager',
			companyId: company.id,
		})

		const brokerToken = await JwtUtils.generateToken(broker.id, 'access', {
			role: 'broker',
			companyId: company.id,
		})

		return {
			company,
			owner,
			manager,
			broker,
			ownerToken,
			managerToken,
			brokerToken,
			plan,
		}
	}

	describe('Authentication & Authorization', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client['custom-fields'].user({ targetUserId: 'fake-id' }).get()

			expect(status).toBe(401)
		})

		it('should return 403 when BROKER tries to view other user fields', async () => {
			const { brokerToken, owner } = await createCompanyWithUsers()

			const { status } = await client['custom-fields'].user({ targetUserId: owner.id }).get({
				headers: {
					Authorization: `Bearer ${brokerToken}`,
				},
			})

			expect(status).toBe(403)
		})

		it('should allow OWNER to view other user fields', async () => {
			const { ownerToken, broker, company } = await createCompanyWithUsers()

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields'].user({ targetUserId: broker.id }).get({
				headers: {
					Authorization: `Bearer ${ownerToken}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.user.id).toBe(broker.id)
		})

		it('should allow MANAGER to view other user fields', async () => {
			const { managerToken, broker, company } = await createCompanyWithUsers()

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields'].user({ targetUserId: broker.id }).get({
				headers: {
					Authorization: `Bearer ${managerToken}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.user.id).toBe(broker.id)
		})
	})

	describe('Successful Get', () => {
		it('should return user info with fields', async () => {
			const { ownerToken, broker, company } = await createCompanyWithUsers()

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Telefone',
				type: FIELD_TYPES.PHONE,
				isActive: true,
				order: 0,
			})

			await customFieldResponseRepository.create({
				userId: broker.id,
				fieldId: field.id,
				value: '11988887777',
			})

			const { status, data } = await client['custom-fields'].user({ targetUserId: broker.id }).get({
				headers: {
					Authorization: `Bearer ${ownerToken}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.user).toEqual({
				id: broker.id,
				name: 'Broker User',
				email: broker.email,
				avatarUrl: null,
			})
			expect(data?.data).toHaveLength(1)
			expect(data?.data[0].value).toBe('11988887777')
		})

		it('should return all fields including inactive (for history)', async () => {
			const { ownerToken, broker, company } = await createCompanyWithUsers()

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

			const { status, data } = await client['custom-fields'].user({ targetUserId: broker.id }).get({
				headers: {
					Authorization: `Bearer ${ownerToken}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data).toHaveLength(2)
		})

		it('should return null value for fields without response', async () => {
			const { ownerToken, broker, company } = await createCompanyWithUsers()

			await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Vazio',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields'].user({ targetUserId: broker.id }).get({
				headers: {
					Authorization: `Bearer ${ownerToken}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data[0].value).toBeNull()
		})
	})

	describe('Error Cases', () => {
		it('should return 403 when target user not found', async () => {
			const { ownerToken } = await createCompanyWithUsers()

			const { status } = await client['custom-fields']
				.user({ targetUserId: 'non-existent-id' })
				.get({
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				})

			expect(status).toBe(403)
		})

		it('should return 403 when target user is from different company', async () => {
			const { ownerToken } = await createCompanyWithUsers()

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				email: generateTestEmail('other'),
			})

			const otherUser = await userRepository.create({
				email: generateTestEmail('other-user'),
				password: 'hashed-password',
				name: 'Other User',
				role: 'broker',
				companyId: otherCompany.id,
				isActive: true,
				isEmailVerified: true,
			})

			const { status } = await client['custom-fields'].user({ targetUserId: otherUser.id }).get({
				headers: {
					Authorization: `Bearer ${ownerToken}`,
				},
			})

			expect(status).toBe(403)
		})
	})

	describe('Plan Feature Check', () => {
		it('should return empty data when plan does not have custom fields feature', async () => {
			const plan = await planRepository.findBySlug('basico')
			if (!plan) throw new Error('Plan not found')

			const company2 = await companyRepository.create({
				name: 'Basic Company',
				email: generateTestEmail('basic-company'),
			})

			const owner2 = await userRepository.create({
				email: generateTestEmail('basic-owner'),
				password: 'hashed-password',
				name: 'Basic Owner',
				role: 'owner',
				companyId: company2.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company2.id, { ownerId: owner2.id })

			await subscriptionRepository.create({
				userId: owner2.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const broker2 = await userRepository.create({
				email: generateTestEmail('basic-broker'),
				password: 'hashed-password',
				name: 'Basic Broker',
				role: 'broker',
				companyId: company2.id,
				isActive: true,
				isEmailVerified: true,
				createdBy: owner2.id,
			})

			const ownerToken = await JwtUtils.generateToken(owner2.id, 'access', {
				role: 'owner',
				companyId: company2.id,
			})

			const { status, data } = await client['custom-fields']
				.user({ targetUserId: broker2.id })
				.get({
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				})

			expect(status).toBe(200)
			expect(data?.data).toEqual([])
		})
	})

	describe('Company Isolation', () => {
		it("should only show fields from user's company", async () => {
			const { ownerToken, broker, company } = await createCompanyWithUsers()

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				email: generateTestEmail('other'),
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
				label: 'Campo de Outro',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields'].user({ targetUserId: broker.id }).get({
				headers: {
					Authorization: `Bearer ${ownerToken}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data).toHaveLength(1)
			expect(data?.data[0].label).toBe('Meu Campo')
		})
	})
})
