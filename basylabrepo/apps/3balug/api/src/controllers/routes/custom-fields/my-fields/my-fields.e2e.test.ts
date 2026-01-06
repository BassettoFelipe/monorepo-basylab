import { beforeEach, describe, expect, it } from 'bun:test'
import { FIELD_TYPES } from '@/db/schema/custom-fields'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET/POST /custom-fields/my-fields - My Fields E2E', () => {
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

	describe('GET /custom-fields/my-fields', () => {
		describe('Authentication', () => {
			it('should return 401 when no auth token provided', async () => {
				const { status } = await client['custom-fields']['my-fields'].get()

				expect(status).toBe(401)
			})
		})

		describe('Successful Get', () => {
			it('should return empty data when no custom fields exist', async () => {
				const { token } = await createUserWithSubscription('broker')

				const { status, data } = await client['custom-fields']['my-fields'].get({
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				expect(status).toBe(200)
				expect(data?.success).toBe(true)
				expect(data?.data).toEqual([])
				expect(data?.hasFeature).toBe(true)
			})

			it('should return fields with user responses', async () => {
				const { token, company, user } = await createUserWithSubscription('broker')

				const field = await customFieldRepository.create({
					companyId: company.id,
					label: 'Telefone Alternativo',
					type: FIELD_TYPES.PHONE,
					isActive: true,
					order: 0,
				})

				await customFieldResponseRepository.create({
					userId: user.id,
					fieldId: field.id,
					value: '11999999999',
				})

				const { status, data } = await client['custom-fields']['my-fields'].get({
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				expect(status).toBe(200)
				expect(data?.data).toHaveLength(1)
				expect(data?.data[0].label).toBe('Telefone Alternativo')
				expect(data?.data[0].value).toBe('11999999999')
			})

			it('should return null value for fields without response', async () => {
				const { token, company } = await createUserWithSubscription('broker')

				await customFieldRepository.create({
					companyId: company.id,
					label: 'Campo sem Resposta',
					type: FIELD_TYPES.TEXT,
					isActive: true,
					order: 0,
				})

				const { status, data } = await client['custom-fields']['my-fields'].get({
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				expect(status).toBe(200)
				expect(data?.data[0].value).toBeNull()
			})

			it('should only return active fields', async () => {
				const { token, company } = await createUserWithSubscription('broker')

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

				const { status, data } = await client['custom-fields']['my-fields'].get({
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				expect(status).toBe(200)
				expect(data?.data).toHaveLength(1)
				expect(data?.data[0].label).toBe('Campo Ativo')
			})
		})

		describe('Plan Feature Check', () => {
			it('should return hasFeature false for basic plan', async () => {
				const { token } = await createUserWithSubscription('owner', 'basico')

				const { status, data } = await client['custom-fields']['my-fields'].get({
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				expect(status).toBe(200)
				expect(data?.hasFeature).toBe(false)
				expect(data?.data).toEqual([])
			})
		})
	})

	describe('POST /custom-fields/my-fields', () => {
		describe('Authentication', () => {
			it('should return 401 when no auth token provided', async () => {
				const { status } = await client['custom-fields']['my-fields'].post({
					fields: [],
				})

				expect(status).toBe(401)
			})
		})

		describe('Successful Save', () => {
			it('should save field responses', async () => {
				const { token, company, user } = await createUserWithSubscription('broker')

				const field1 = await customFieldRepository.create({
					companyId: company.id,
					label: 'Nome Completo',
					type: FIELD_TYPES.TEXT,
					isActive: true,
					order: 0,
				})

				const field2 = await customFieldRepository.create({
					companyId: company.id,
					label: 'Idade',
					type: FIELD_TYPES.NUMBER,
					isActive: true,
					order: 1,
				})

				const { status, data } = await client['custom-fields']['my-fields'].post(
					{
						fields: [
							{ fieldId: field1.id, value: 'João Silva' },
							{ fieldId: field2.id, value: '30' },
						],
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect(status).toBe(200)
				expect(data?.success).toBe(true)
				expect(data?.message).toBe('Informações salvas com sucesso')

				const responses = await customFieldResponseRepository.findByUserId(user.id)
				expect(responses).toHaveLength(2)
			})

			it('should update existing responses (upsert)', async () => {
				const { token, company, user } = await createUserWithSubscription('broker')

				const field = await customFieldRepository.create({
					companyId: company.id,
					label: 'Nome',
					type: FIELD_TYPES.TEXT,
					isActive: true,
					order: 0,
				})

				await customFieldResponseRepository.create({
					userId: user.id,
					fieldId: field.id,
					value: 'Valor Antigo',
				})

				const { status } = await client['custom-fields']['my-fields'].post(
					{
						fields: [{ fieldId: field.id, value: 'Valor Novo' }],
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect(status).toBe(200)

				const responses = await customFieldResponseRepository.findByUserId(user.id)
				expect(responses).toHaveLength(1)
				expect(responses[0].value).toBe('Valor Novo')
			})

			it('should allow null value to clear field', async () => {
				const { token, company, user } = await createUserWithSubscription('broker')

				const field = await customFieldRepository.create({
					companyId: company.id,
					label: 'Campo Opcional',
					type: FIELD_TYPES.TEXT,
					isRequired: false,
					isActive: true,
					order: 0,
				})

				await customFieldResponseRepository.create({
					userId: user.id,
					fieldId: field.id,
					value: 'Tinha valor',
				})

				const { status } = await client['custom-fields']['my-fields'].post(
					{
						fields: [{ fieldId: field.id, value: null }],
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect(status).toBe(200)

				const responses = await customFieldResponseRepository.findByUserId(user.id)
				expect(responses[0].value).toBeNull()
			})
		})

		describe('Validation', () => {
			it('should return 400 when required field is empty', async () => {
				const { token, company } = await createUserWithSubscription('broker')

				const field = await customFieldRepository.create({
					companyId: company.id,
					label: 'Campo Obrigatório',
					type: FIELD_TYPES.TEXT,
					isRequired: true,
					isActive: true,
					order: 0,
				})

				const { status } = await client['custom-fields']['my-fields'].post(
					{
						fields: [{ fieldId: field.id, value: '' }],
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect(status).toBe(400)
			})

			it('should return 400 when required field is null', async () => {
				const { token, company } = await createUserWithSubscription('broker')

				const field = await customFieldRepository.create({
					companyId: company.id,
					label: 'Campo Obrigatório',
					type: FIELD_TYPES.TEXT,
					isRequired: true,
					isActive: true,
					order: 0,
				})

				const { status } = await client['custom-fields']['my-fields'].post(
					{
						fields: [{ fieldId: field.id, value: null }],
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect(status).toBe(400)
			})

			it('should return 400 when required field is missing', async () => {
				const { token, company } = await createUserWithSubscription('broker')

				await customFieldRepository.create({
					companyId: company.id,
					label: 'Campo Obrigatório',
					type: FIELD_TYPES.TEXT,
					isRequired: true,
					isActive: true,
					order: 0,
				})

				const { status } = await client['custom-fields']['my-fields'].post(
					{
						fields: [],
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect(status).toBe(400)
			})
		})

		describe('Plan Feature Check', () => {
			it('should return 403 when plan does not have custom fields feature', async () => {
				const { token } = await createUserWithSubscription('owner', 'basico')

				const { status } = await client['custom-fields']['my-fields'].post(
					{
						fields: [],
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

		describe('Security', () => {
			it('should ignore fields that do not belong to company', async () => {
				const { token, company, user } = await createUserWithSubscription('broker')

				const otherCompany = await companyRepository.create({
					name: 'Other Company',
					email: generateTestEmail('other'),
				})

				const myField = await customFieldRepository.create({
					companyId: company.id,
					label: 'Meu Campo',
					type: FIELD_TYPES.TEXT,
					isActive: true,
					order: 0,
				})

				const otherField = await customFieldRepository.create({
					companyId: otherCompany.id,
					label: 'Campo de Outro',
					type: FIELD_TYPES.TEXT,
					isActive: true,
					order: 0,
				})

				const { status } = await client['custom-fields']['my-fields'].post(
					{
						fields: [
							{ fieldId: myField.id, value: 'Meu Valor' },
							{ fieldId: otherField.id, value: 'Não deveria salvar' },
						],
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect(status).toBe(200)

				const responses = await customFieldResponseRepository.findByUserId(user.id)
				expect(responses).toHaveLength(1)
				expect(responses[0].fieldId).toBe(myField.id)
			})
		})
	})
})
