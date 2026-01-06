import { beforeEach, describe, expect, it } from 'bun:test'
import { CONTRACT_STATUS } from '@/db/schema/contracts'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('POST /contracts/:id/terminate - Terminate Contract E2E', () => {
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

	async function createContract(
		companyId: string,
		propertyId: string,
		ownerId: string,
		tenantId: string,
		createdById: string,
		overrides: Partial<{ status: string }> = {},
	) {
		const startDate = new Date()
		const endDate = new Date()
		endDate.setFullYear(endDate.getFullYear() + 1)

		return contractRepository.create({
			companyId,
			propertyId,
			ownerId,
			tenantId,
			startDate,
			endDate,
			rentalAmount: 150000,
			paymentDay: 5,
			status: overrides.status ?? CONTRACT_STATUS.ACTIVE,
			createdBy: createdById,
		})
	}

	describe('Authentication & Authorization', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client.api
				.contracts({ id: '00000000-0000-0000-0000-000000000001' })
				.terminate.post({})

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.api
				.contracts({ id: '00000000-0000-0000-0000-000000000001' })
				.terminate.post(
					{},
					{
						headers: {
							Authorization: 'Bearer invalid-token',
						},
					},
				)

			expect(status).toBe(401)
		})

		it('should allow OWNER to terminate contract', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
			)

			const { status, data } = await client.api.contracts({ id: contract.id }).terminate.post(
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})

		it('should allow MANAGER to terminate contract', async () => {
			const { token, company, owner } = await createUserWithSubscription('manager')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
			)

			const { status, data } = await client.api.contracts({ id: contract.id }).terminate.post(
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})

		it('should return 403 when BROKER tries to terminate contract', async () => {
			const { token, company, owner } = await createUserWithSubscription('broker')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
			)

			const { status } = await client.api.contracts({ id: contract.id }).terminate.post(
				{},
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
		it('should return 422 when id is not a valid UUID', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status } = await client.api.contracts({ id: 'invalid-uuid' }).terminate.post(
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when reason exceeds max length', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
			)

			const { status } = await client.api.contracts({ id: contract.id }).terminate.post(
				{
					reason: 'a'.repeat(501),
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

	describe('Successful Termination', () => {
		it('should terminate contract without reason', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
			)

			const { status, data } = await client.api.contracts({ id: contract.id }).terminate.post(
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.message).toBe('Contrato encerrado com sucesso')
			expect(data?.data.status).toBe(CONTRACT_STATUS.TERMINATED)
			expect(data?.data.terminatedAt).not.toBeNull()
			expect(data?.data.terminationReason).toBeNull()
		})

		it('should terminate contract with reason', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
			)

			const terminationReason = 'Locatário solicitou rescisão antecipada'

			const { status, data } = await client.api.contracts({ id: contract.id }).terminate.post(
				{
					reason: terminationReason,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.status).toBe(CONTRACT_STATUS.TERMINATED)
			expect(data?.data.terminationReason).toBe(terminationReason)
		})

		it('should persist termination in repository', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
			)

			await client.api.contracts({ id: contract.id }).terminate.post(
				{
					reason: 'Motivo do encerramento',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			const terminatedContract = await contractRepository.findById(contract.id)
			expect(terminatedContract?.status).toBe(CONTRACT_STATUS.TERMINATED)
			expect(terminatedContract?.terminatedAt).not.toBeNull()
			expect(terminatedContract?.terminationReason).toBe('Motivo do encerramento')
		})
	})

	describe('Business Rules', () => {
		it('should not allow terminating already terminated contract', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
				{ status: CONTRACT_STATUS.TERMINATED },
			)

			const { status } = await client.api.contracts({ id: contract.id }).terminate.post(
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).not.toBe(200)
		})

		it('should not allow terminating cancelled contract', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property, propertyOwner } = await createPropertyWithOwner(company.id, owner.id)
			const tenant = await createTenant(company.id, owner.id)
			const contract = await createContract(
				company.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner.id,
				{ status: CONTRACT_STATUS.CANCELLED },
			)

			const { status } = await client.api.contracts({ id: contract.id }).terminate.post(
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).not.toBe(200)
		})
	})

	describe('Error Cases', () => {
		it('should return error when contract does not exist', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status } = await client.api
				.contracts({ id: '00000000-0000-0000-0000-000000000999' })
				.terminate.post(
					{},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

			expect(status).not.toBe(200)
		})

		it('should not allow terminating contract from another company', async () => {
			const { token } = await createUserWithSubscription('owner')

			// Create another company with contract
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
			const { property, propertyOwner } = await createPropertyWithOwner(company2.id, owner2.id)
			const tenant = await createTenant(company2.id, owner2.id)
			const contract = await createContract(
				company2.id,
				property.id,
				propertyOwner.id,
				tenant.id,
				owner2.id,
			)

			const { status } = await client.api.contracts({ id: contract.id }).terminate.post(
				{},
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
