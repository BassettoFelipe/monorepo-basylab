import { beforeEach, describe, expect, it } from 'bun:test'
import { FIELD_TYPES } from '@/db/schema/custom-fields'
import { clearTestData, createAuthenticatedClient, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('DELETE /custom-fields/:id - Delete Custom Field E2E', () => {
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
			const { status } = await client['custom-fields']({
				id: 'fake-id',
			}).delete()

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const authClient = createAuthenticatedClient('invalid-token')
			const { status } = await authClient['custom-fields']({
				id: 'fake-id',
			}).delete()

			expect(status).toBe(401)
		})

		it('should return 403 when BROKER tries to delete field', async () => {
			const { token, company } = await createUserWithSubscription('broker')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient['custom-fields']({
				id: field.id,
			}).delete()

			expect(status).toBe(403)
		})

		it('should return 403 when MANAGER tries to delete field', async () => {
			const { token, company } = await createUserWithSubscription('manager')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient['custom-fields']({
				id: field.id,
			}).delete()

			expect(status).toBe(403)
		})
	})

	describe('Successful Deletion', () => {
		it('should delete field successfully', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo para Excluir',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const authClient = createAuthenticatedClient(token)
			const { status, data } = await authClient['custom-fields']({
				id: field.id,
			}).delete()

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.message).toBe('Campo excluído com sucesso')

			const deletedField = await customFieldRepository.findById(field.id)
			expect(deletedField).toBeNull()
		})

		it('should delete inactive field', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Inativo',
				type: FIELD_TYPES.TEXT,
				isActive: false,
				order: 0,
			})

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient['custom-fields']({
				id: field.id,
			}).delete()

			expect(status).toBe(200)
		})
	})

	describe('Error Cases', () => {
		it('should return 404 when field does not exist', async () => {
			const { token } = await createUserWithSubscription('owner')

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient['custom-fields']({
				id: 'non-existent-id',
			}).delete()

			expect(status).toBe(404)
		})

		it('should return 403 when trying to delete field from another company', async () => {
			const { token } = await createUserWithSubscription('owner')

			const otherCompany = await companyRepository.create({
				name: 'Other Company',
				email: generateTestEmail('other'),
			})

			const field = await customFieldRepository.create({
				companyId: otherCompany.id,
				label: 'Campo de Outra Empresa',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const authClient = createAuthenticatedClient(token)
			const { status } = await authClient['custom-fields']({
				id: field.id,
			}).delete()

			expect(status).toBe(403)
		})
	})

	describe('Data Integrity', () => {
		it('should not affect other fields when deleting one', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field1 = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo 1',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const field2 = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo 2',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 1,
			})

			const authClient = createAuthenticatedClient(token)
			await authClient['custom-fields']({ id: field1.id }).delete()

			const remainingField = await customFieldRepository.findById(field2.id)
			expect(remainingField).not.toBeNull()
			expect(remainingField?.label).toBe('Campo 2')
		})
	})
})
