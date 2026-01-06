import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createAuthenticatedClient, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('DELETE /properties/:id - Delete Property E2E', () => {
	const {
		client,
		userRepository,
		companyRepository,
		planRepository,
		subscriptionRepository,
		propertyOwnerRepository,
		propertyRepository,
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

	async function createPropertyWithOwner(companyId: string, createdById: string) {
		const propertyOwner = await propertyOwnerRepository.create({
			companyId,
			name: 'Property Owner',
			email: generateTestEmail('property-owner'),
			phone: '11999999999',
			document: '12345678901',
			createdBy: createdById,
		})

		const property = await propertyRepository.create({
			companyId,
			ownerId: propertyOwner.id,
			title: 'Apartamento para Deletar',
			type: 'apartment',
			listingType: 'rent',
			address: 'Rua Teste, 123',
			city: 'São Paulo',
			state: 'SP',
			zipCode: '01234567',
			rentalPrice: 150000,
			createdBy: createdById,
		})

		return { propertyOwner, property }
	}

	describe('Authentication & Authorization', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client.api
				.properties({ id: '00000000-0000-0000-0000-000000000001' })
				.delete()

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const authClient = createAuthenticatedClient('invalid-token')
			const { status } = await authClient.api
				.properties({ id: '00000000-0000-0000-0000-000000000001' })
				.delete()

			expect(status).toBe(401)
		})

		it('should allow OWNER to delete property', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property } = await createPropertyWithOwner(company.id, owner.id)

			const authClient = createAuthenticatedClient(token)
			const { status, data } = await authClient.api.properties({ id: property.id }).delete()

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})

		it('should allow MANAGER to delete property', async () => {
			const { token, company, owner } = await createUserWithSubscription('manager')
			const { property } = await createPropertyWithOwner(company.id, owner.id)

			const authClient = createAuthenticatedClient(token)
			const { status, data } = await authClient.api.properties({ id: property.id }).delete()

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})

		it('should not allow BROKER to delete property', async () => {
			const { token, company, owner } = await createUserWithSubscription('broker')
			const { property } = await createPropertyWithOwner(company.id, owner.id)

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient.api.properties({ id: property.id }).delete()

			expect(status).toBe(403)
		})

		it('should not allow INSURANCE_ANALYST to delete property', async () => {
			const { token, company, owner } = await createUserWithSubscription('insurance_analyst')
			const { property } = await createPropertyWithOwner(company.id, owner.id)

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient.api.properties({ id: property.id }).delete()

			expect(status).toBe(403)
		})
	})

	describe('Input Validation', () => {
		it('should return 422 when id is not a valid UUID', async () => {
			const { token } = await createUserWithSubscription('owner')

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient.api.properties({ id: 'invalid-uuid' }).delete()

			expect(status).toBe(422)
		})
	})

	describe('Successful Deletion', () => {
		it('should delete property and return success message', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property } = await createPropertyWithOwner(company.id, owner.id)

			const authClient = createAuthenticatedClient(token)
			const { status, data } = await authClient.api.properties({ id: property.id }).delete()

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.message).toBeDefined()
		})

		it('should remove property from repository', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			const { property } = await createPropertyWithOwner(company.id, owner.id)

			const authClient = createAuthenticatedClient(token)
			await authClient.api.properties({ id: property.id }).delete()

			const deletedProperty = await propertyRepository.findById(property.id)
			expect(deletedProperty).toBeNull()
		})
	})

	describe('Business Rules', () => {
		it('should not allow deleting property from another company', async () => {
			const { token } = await createUserWithSubscription('owner')

			// Create property in another company
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

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient.api.properties({ id: property.id }).delete()

			expect(status).not.toBe(200)
		})

		it('should return error for non-existent property', async () => {
			const { token } = await createUserWithSubscription('owner')

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient.api
				.properties({ id: '00000000-0000-0000-0000-000000000999' })
				.delete()

			expect(status).not.toBe(200)
		})
	})
})
