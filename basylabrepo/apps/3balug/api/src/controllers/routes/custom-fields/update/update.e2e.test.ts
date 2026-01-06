import { beforeEach, describe, expect, it } from 'bun:test'
import { FIELD_TYPES } from '@/db/schema/custom-fields'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('PUT /custom-fields/:id - Update Custom Field E2E', () => {
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
			const { status } = await client['custom-fields']({ id: 'fake-id' }).put({
				label: 'Updated Field',
			})

			expect(status).toBe(401)
		})

		it('should return 403 when BROKER tries to update field', async () => {
			const { token, company } = await createUserWithSubscription('broker')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Original',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status } = await client['custom-fields']({ id: field.id }).put(
				{
					label: 'Updated',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(403)
		})

		it('should return 403 when MANAGER tries to update field', async () => {
			const { token, company } = await createUserWithSubscription('manager')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Original',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status } = await client['custom-fields']({ id: field.id }).put(
				{
					label: 'Updated',
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

	describe('Successful Updates', () => {
		it('should update field label', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Nome Original',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields']({
				id: field.id,
			}).put(
				{
					label: 'Nome Atualizado',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.message).toBe('Campo atualizado com sucesso')
			expect(data?.data.label).toBe('Nome Atualizado')
		})

		it('should update field type', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields']({
				id: field.id,
			}).put(
				{
					type: FIELD_TYPES.TEXTAREA,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.type).toBe(FIELD_TYPES.TEXTAREA)
		})

		it('should update field to inactive', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Ativo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields']({
				id: field.id,
			}).put(
				{
					isActive: false,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.isActive).toBe(false)
		})

		it('should update placeholder and helpText', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Email',
				type: FIELD_TYPES.EMAIL,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields']({
				id: field.id,
			}).put(
				{
					placeholder: 'seu@email.com',
					helpText: 'Informe seu melhor email',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.placeholder).toBe('seu@email.com')
			expect(data?.data.helpText).toBe('Informe seu melhor email')
		})

		it('should update select options', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Estado Civil',
				type: FIELD_TYPES.SELECT,
				options: ['Solteiro', 'Casado'],
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields']({
				id: field.id,
			}).put(
				{
					options: ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável'],
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.options).toHaveLength(5)
		})

		it('should update validation rules', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Idade',
				type: FIELD_TYPES.NUMBER,
				validation: { min: 0, max: 100 },
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields']({
				id: field.id,
			}).put(
				{
					validation: { min: 18, max: 120 },
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.validation).toEqual({ min: 18, max: 120 })
		})

		it('should update file config', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Documento',
				type: FIELD_TYPES.FILE,
				fileConfig: { maxFileSize: 5, maxFiles: 1 },
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields']({
				id: field.id,
			}).put(
				{
					fileConfig: {
						maxFileSize: 10,
						maxFiles: 5,
						allowedTypes: ['application/pdf'],
					},
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.fileConfig).toEqual({
				maxFileSize: 10,
				maxFiles: 5,
				allowedTypes: ['application/pdf'],
			})
		})

		it('should update isRequired', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo Opcional',
				type: FIELD_TYPES.TEXT,
				isRequired: false,
				isActive: true,
				order: 0,
			})

			const { status, data } = await client['custom-fields']({
				id: field.id,
			}).put(
				{
					isRequired: true,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.isRequired).toBe(true)
		})
	})

	describe('Error Cases', () => {
		it('should return 404 when field does not exist', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status } = await client['custom-fields']({
				id: 'non-existent-id',
			}).put(
				{
					label: 'Updated',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(404)
		})

		it('should return 403 when trying to update field from another company', async () => {
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

			const { status } = await client['custom-fields']({ id: field.id }).put(
				{
					label: 'Tentando Alterar',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(403)
		})

		it('should return 422 when label is too short', async () => {
			const { token, company } = await createUserWithSubscription('owner')

			const field = await customFieldRepository.create({
				companyId: company.id,
				label: 'Campo',
				type: FIELD_TYPES.TEXT,
				isActive: true,
				order: 0,
			})

			const { status } = await client['custom-fields']({ id: field.id }).put(
				{
					label: 'A',
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
})
