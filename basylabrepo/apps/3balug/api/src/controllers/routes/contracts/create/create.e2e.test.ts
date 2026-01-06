import { beforeEach, describe, expect, it } from 'bun:test'
import { CONTRACT_STATUS } from '@/db/schema/contracts'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('POST /contracts - Create Contract E2E', () => {
	const {
		client,
		userRepository,
		companyRepository,
		planRepository,
		subscriptionRepository,
		propertyRepository,
		propertyOwnerRepository,
		tenantRepository,
		contractRepository,
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

	async function createPropertyWithOwner(companyId: string, ownerId: string) {
		const propertyOwner = await propertyOwnerRepository.create({
			companyId,
			name: 'Property Owner',
			email: generateTestEmail('property-owner'),
			phone: '11999999999',
			document: '12345678901',
			createdBy: ownerId,
		})

		const property = await propertyRepository.create({
			companyId,
			ownerId: propertyOwner.id,
			title: 'Apartamento Teste',
			type: 'apartment',
			address: 'Rua Teste, 123',
			city: 'São Paulo',
			state: 'SP',
			zipCode: '01234567',
			rentalPrice: 150000,
			createdBy: ownerId,
		})

		return { propertyOwner, property }
	}

	async function createTenant(companyId: string, createdById: string) {
		return tenantRepository.create({
			companyId,
			name: 'Test Tenant',
			email: generateTestEmail('tenant'),
			phone: '11888888888',
			cpf: '98765432100',
			createdBy: createdById,
		})
	}

	function getFutureDates() {
		const startDate = new Date()
		startDate.setMonth(startDate.getMonth() + 1)
		const endDate = new Date(startDate)
		endDate.setFullYear(endDate.getFullYear() + 1)

		return {
			startDate: startDate.toISOString().split('T')[0],
			endDate: endDate.toISOString().split('T')[0],
		}
	}

	describe('Authentication & Authorization', () => {
		it('should return 401 when no auth token provided', async () => {
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post({
				propertyId: '00000000-0000-0000-0000-000000000001',
				tenantId: '00000000-0000-0000-0000-000000000002',
				startDate: dates.startDate,
				endDate: dates.endDate,
				rentalAmount: 150000,
				paymentDay: 5,
			})

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000001',
					tenantId: '00000000-0000-0000-0000-000000000002',
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: 'Bearer invalid-token',
					},
				},
			)

			expect(status).toBe(401)
		})

		it('should allow OWNER to create contract', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const dates = getFutureDates()

			const { status, data } = await client.api.contracts.post(
				{
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
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

		it('should allow MANAGER to create contract', async () => {
			const { token, company, owner } = await createUserWithSubscription('manager')
			const { property } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const dates = getFutureDates()

			const { status, data } = await client.api.contracts.post(
				{
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
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

		it('should allow BROKER to create contract', async () => {
			const { token, company, owner, user: broker } = await createUserWithSubscription('broker')
			const { property } = await createPropertyWithOwner(company.id, owner.id)
			// Atribuir o broker como responsável pelo imóvel
			await propertyRepository.update(property.id, { brokerId: broker.id })
			// Criar tenant com o broker como createdBy
			const tenant = await createTenant(company.id, broker.id)
			const dates = getFutureDates()

			const { status, data } = await client.api.contracts.post(
				{
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
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
	})

	describe('Input Validation', () => {
		it('should return 422 when propertyId is not a valid UUID', async () => {
			const { token } = await createUserWithSubscription('owner')
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: 'invalid-uuid',
					tenantId: '00000000-0000-0000-0000-000000000002',
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when tenantId is not a valid UUID', async () => {
			const { token } = await createUserWithSubscription('owner')
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000001',
					tenantId: 'invalid-uuid',
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when rentalAmount is less than 1', async () => {
			const { token } = await createUserWithSubscription('owner')
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000001',
					tenantId: '00000000-0000-0000-0000-000000000002',
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 0,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when paymentDay is greater than 31', async () => {
			const { token } = await createUserWithSubscription('owner')
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000001',
					tenantId: '00000000-0000-0000-0000-000000000002',
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 32,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when paymentDay is less than 1', async () => {
			const { token } = await createUserWithSubscription('owner')
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000001',
					tenantId: '00000000-0000-0000-0000-000000000002',
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 0,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when startDate is not a valid date format', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status } = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000001',
					tenantId: '00000000-0000-0000-0000-000000000002',
					startDate: 'invalid-date',
					endDate: '2025-12-31',
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when notes exceeds max length', async () => {
			const { token } = await createUserWithSubscription('owner')
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000001',
					tenantId: '00000000-0000-0000-0000-000000000002',
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
					notes: 'a'.repeat(2001),
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

	describe('Successful Creation', () => {
		it('should create a contract with required fields only', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const dates = getFutureDates()

			const { status, data } = await client.api.contracts.post(
				{
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.message).toBe('Contrato criado com sucesso')
			expect(data?.data.propertyId).toBe(property.id)
			expect(data?.data.tenantId).toBe(tenant.id)
			expect(data?.data.ownerId).toBe(propertyOwner.id)
			expect(data?.data.companyId).toBe(company.id)
			expect(data?.data.rentalAmount).toBe(150000)
			expect(data?.data.paymentDay).toBe(5)
			expect(data?.data.status).toBe(CONTRACT_STATUS.ACTIVE)
			expect(data?.data.brokerId).toBeNull()
			expect(data?.data.depositAmount).toBeNull()
			expect(data?.data.notes).toBeNull()
		})

		it('should create a contract with all optional fields', async () => {
			const { token, company, owner, user } = await createUserWithSubscription('broker')
			const { property } = await createPropertyWithOwner(company.id, owner.id)
			// Atribuir o broker como responsável pelo imóvel
			await propertyRepository.update(property.id, { brokerId: user.id })
			// Criar tenant com o broker como createdBy
			const tenant = await createTenant(company.id, user.id)
			const dates = getFutureDates()

			const { status, data } = await client.api.contracts.post(
				{
					propertyId: property.id,
					tenantId: tenant.id,
					brokerId: user.id,
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 200000,
					paymentDay: 10,
					depositAmount: 400000,
					notes: 'Contrato com caução de 2 meses',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data.brokerId).toBe(user.id)
			expect(data?.data.depositAmount).toBe(400000)
			expect(data?.data.notes).toBe('Contrato com caução de 2 meses')
			expect(data?.data.paymentDay).toBe(10)
		})

		it('should store contract in repository', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const dates = getFutureDates()

			const { data } = await client.api.contracts.post(
				{
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			const storedContract = await contractRepository.findById(data!.data.id)
			expect(storedContract).not.toBeNull()
			expect(storedContract?.propertyId).toBe(property.id)
			expect(storedContract?.tenantId).toBe(tenant.id)
		})
	})

	describe('Business Rules', () => {
		it('should not allow creating contract for property from another company', async () => {
			const { token } = await createUserWithSubscription('owner')

			// Create another company with property
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

			const { property } = await createPropertyWithOwner(company2.id, owner2.id)
			const tenant = await createTenant(company2.id, owner2.id)
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: property.id,
					tenantId: tenant.id,
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).not.toBe(200)
		})

		it('should not allow creating contract for non-existent property', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const tenant = await createTenant(company.id, owner.id)
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000999',
					tenantId: tenant.id,
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).not.toBe(200)
		})

		it('should not allow creating contract for non-existent tenant', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property } = await createPropertyWithOwner(company.id, owner.id)
			const dates = getFutureDates()

			const { status } = await client.api.contracts.post(
				{
					propertyId: property.id,
					tenantId: '00000000-0000-0000-0000-000000000999',
					startDate: dates.startDate,
					endDate: dates.endDate,
					rentalAmount: 150000,
					paymentDay: 5,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).not.toBe(200)
		})
	})
})
