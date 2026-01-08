import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET /property-owners - List Property Owners E2E', () => {
	const {
		client,
		userRepository,
		companyRepository,
		planRepository,
		subscriptionRepository,
		propertyOwnerRepository,
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

	async function createPropertyOwner(
		companyId: string,
		createdById: string,
		name: string,
		document: string,
		options: {
			documentType?: 'cpf' | 'cnpj'
			email?: string | null
			phone?: string | null
			city?: string | null
			state?: string | null
		} = {},
	) {
		return propertyOwnerRepository.create({
			companyId,
			name,
			documentType: options.documentType ?? 'cpf',
			document,
			email: options.email ?? null,
			phone: options.phone === undefined ? null : options.phone,
			city: options.city ?? null,
			state: options.state ?? null,
			createdBy: createdById,
		})
	}

	describe('Authentication & Authorization', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client.api['property-owners'].get()

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.api['property-owners'].get({
				headers: {
					Authorization: 'Bearer invalid-token',
				},
			})

			expect(status).toBe(401)
		})

		it('should allow OWNER to list property owners', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})

		it('should allow MANAGER to list property owners', async () => {
			const { token } = await createUserWithSubscription('manager')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})

		it('should allow INSURANCE_ANALYST to list property owners', async () => {
			const { token } = await createUserWithSubscription('insurance_analyst')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
		})
	})

	describe('Listing', () => {
		it('should return empty list when no property owners exist', async () => {
			const { token } = await createUserWithSubscription('owner')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data).toEqual([])
			expect(data?.total).toBe(0)
		})

		it('should return list of property owners', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao Silva', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Maria Santos', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.success).toBe(true)
			expect(data?.data.length).toBe(2)
			expect(data?.total).toBe(2)
		})

		it('should only return property owners from the same company', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao Silva', '12345678909')

			// Create property owner in another company
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
			await createPropertyOwner(company2.id, owner2.id, 'Maria Santos', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Joao Silva')
		})
	})

	describe('Search Filter', () => {
		it('should filter property owners by search term (name)', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao Silva', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Maria Santos', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					search: 'Joao',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Joao Silva')
		})

		it('should filter by document number', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao Silva', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Maria Santos', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					search: '12345678909',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Joao Silva')
		})

		it('should search case insensitively', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao Silva', '12345678909')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					search: 'JOAO',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
		})
	})

	describe('Document Type Filter', () => {
		it('should filter by CPF document type', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Pessoa Fisica', '12345678909', {
				documentType: 'cpf',
			})
			await createPropertyOwner(company.id, owner.id, 'Empresa LTDA', '12345678000190', {
				documentType: 'cnpj',
			})

			const { status, data } = await client.api['property-owners'].get({
				query: {
					documentType: 'cpf',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Pessoa Fisica')
		})

		it('should filter by CNPJ document type', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Pessoa Fisica', '12345678909', {
				documentType: 'cpf',
			})
			await createPropertyOwner(company.id, owner.id, 'Empresa LTDA', '12345678000190', {
				documentType: 'cnpj',
			})

			const { status, data } = await client.api['property-owners'].get({
				query: {
					documentType: 'cnpj',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Empresa LTDA')
		})
	})

	describe('State Filter', () => {
		it('should filter by state', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao SP', '12345678909', { state: 'SP' })
			await createPropertyOwner(company.id, owner.id, 'Maria RJ', '52998224725', { state: 'RJ' })

			const { status, data } = await client.api['property-owners'].get({
				query: {
					state: 'SP',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Joao SP')
		})
	})

	describe('City Filter', () => {
		it('should filter by city', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao SP', '12345678909', {
				city: 'Sao Paulo',
			})
			await createPropertyOwner(company.id, owner.id, 'Maria RJ', '52998224725', {
				city: 'Rio de Janeiro',
			})

			const { status, data } = await client.api['property-owners'].get({
				query: {
					city: 'Sao Paulo',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Joao SP')
		})
	})

	describe('Has Email Filter', () => {
		it('should filter owners with email', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Com Email', '12345678909', {
				email: 'test@email.com',
			})
			await createPropertyOwner(company.id, owner.id, 'Sem Email', '52998224725', { email: null })

			const { status, data } = await client.api['property-owners'].get({
				query: {
					hasEmail: 'true',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Com Email')
		})

		it('should filter owners without email', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Com Email', '12345678909', {
				email: 'test@email.com',
			})
			await createPropertyOwner(company.id, owner.id, 'Sem Email', '52998224725', { email: null })

			const { status, data } = await client.api['property-owners'].get({
				query: {
					hasEmail: 'false',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Sem Email')
		})
	})

	describe('Has Phone Filter', () => {
		it('should filter owners with phone', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Com Telefone', '12345678909', {
				phone: '11999999999',
			})
			await createPropertyOwner(company.id, owner.id, 'Sem Telefone', '52998224725', {
				phone: null,
			})

			const { status, data } = await client.api['property-owners'].get({
				query: {
					hasPhone: 'true',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Com Telefone')
		})

		it('should filter owners without phone', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Com Telefone', '12345678909', {
				phone: '11999999999',
			})
			await createPropertyOwner(company.id, owner.id, 'Sem Telefone', '52998224725', {
				phone: null,
			})

			const { status, data } = await client.api['property-owners'].get({
				query: {
					hasPhone: 'false',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Sem Telefone')
		})
	})

	describe('Combined Filters', () => {
		it('should combine multiple filters', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao SP CPF', '12345678909', {
				documentType: 'cpf',
				state: 'SP',
				email: 'joao@email.com',
			})
			await createPropertyOwner(company.id, owner.id, 'Maria SP CNPJ', '12345678000190', {
				documentType: 'cnpj',
				state: 'SP',
				email: 'maria@email.com',
			})
			await createPropertyOwner(company.id, owner.id, 'Carlos RJ CPF', '52998224725', {
				documentType: 'cpf',
				state: 'RJ',
				email: null,
			})

			const { status, data } = await client.api['property-owners'].get({
				query: {
					state: 'SP',
					documentType: 'cpf',
					hasEmail: 'true',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Joao SP CPF')
		})

		it('should combine search with filters', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Joao SP', '12345678909', { state: 'SP' })
			await createPropertyOwner(company.id, owner.id, 'Joao RJ', '52998224725', { state: 'RJ' })
			await createPropertyOwner(company.id, owner.id, 'Maria SP', '11144477735', { state: 'SP' })

			const { status, data } = await client.api['property-owners'].get({
				query: {
					search: 'Joao',
					state: 'SP',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
			expect(data?.data[0].name).toBe('Joao SP')
		})
	})

	describe('Sorting', () => {
		it('should sort by name ascending (default)', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Carlos', '11144477735')
			await createPropertyOwner(company.id, owner.id, 'Ana', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Bruno', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data[0].name).toBe('Ana')
			expect(data?.data[1].name).toBe('Bruno')
			expect(data?.data[2].name).toBe('Carlos')
		})

		it('should sort by name descending', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Carlos', '11144477735')
			await createPropertyOwner(company.id, owner.id, 'Ana', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Bruno', '52998224725')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					sortBy: 'name',
					sortOrder: 'desc',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data[0].name).toBe('Carlos')
			expect(data?.data[1].name).toBe('Bruno')
			expect(data?.data[2].name).toBe('Ana')
		})

		it('should sort by createdAt ascending', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Primeiro', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Segundo', '52998224725')
			await createPropertyOwner(company.id, owner.id, 'Terceiro', '11144477735')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					sortBy: 'createdAt',
					sortOrder: 'asc',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data[0].name).toBe('Primeiro')
			expect(data?.data[2].name).toBe('Terceiro')
		})

		it('should sort by createdAt descending', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Primeiro', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Segundo', '52998224725')
			await createPropertyOwner(company.id, owner.id, 'Terceiro', '11144477735')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					sortBy: 'createdAt',
					sortOrder: 'desc',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(3)
			// Verifica que os dados estao ordenados por createdAt descendente
			const dates = data?.data.map((d: { createdAt: string }) => new Date(d.createdAt).getTime())
			for (let i = 1; i < dates!.length; i++) {
				expect(dates![i]).toBeLessThanOrEqual(dates![i - 1])
			}
		})

		it('should sort by city', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Sao Paulo Owner', '12345678909', {
				city: 'Sao Paulo',
			})
			await createPropertyOwner(company.id, owner.id, 'Curitiba Owner', '52998224725', {
				city: 'Curitiba',
			})
			await createPropertyOwner(company.id, owner.id, 'Rio Owner', '11144477735', {
				city: 'Rio de Janeiro',
			})

			const { status, data } = await client.api['property-owners'].get({
				query: {
					sortBy: 'city',
					sortOrder: 'asc',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data[0].city).toBe('Curitiba')
			expect(data?.data[1].city).toBe('Rio de Janeiro')
			expect(data?.data[2].city).toBe('Sao Paulo')
		})

		it('should sort by state', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'SP Owner', '12345678909', { state: 'SP' })
			await createPropertyOwner(company.id, owner.id, 'PR Owner', '52998224725', { state: 'PR' })
			await createPropertyOwner(company.id, owner.id, 'RJ Owner', '11144477735', { state: 'RJ' })

			const { status, data } = await client.api['property-owners'].get({
				query: {
					sortBy: 'state',
					sortOrder: 'asc',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data[0].state).toBe('PR')
			expect(data?.data[1].state).toBe('RJ')
			expect(data?.data[2].state).toBe('SP')
		})
	})

	describe('Pagination', () => {
		it('should respect limit parameter', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Owner 1', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Owner 2', '52998224725')
			await createPropertyOwner(company.id, owner.id, 'Owner 3', '11144477735')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					limit: 2,
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(2)
			expect(data?.total).toBe(3)
			expect(data?.limit).toBe(2)
		})

		it('should respect offset parameter', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Ana', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Bruno', '52998224725')
			await createPropertyOwner(company.id, owner.id, 'Carlos', '11144477735')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					offset: 1,
					sortBy: 'name',
					sortOrder: 'asc',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(2)
			expect(data?.offset).toBe(1)
			expect(data?.data[0].name).toBe('Bruno')
		})

		it('should combine limit and offset for pagination', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Ana', '12345678909')
			await createPropertyOwner(company.id, owner.id, 'Bruno', '52998224725')
			await createPropertyOwner(company.id, owner.id, 'Carlos', '11144477735')
			await createPropertyOwner(company.id, owner.id, 'Diana', '20142327093')

			const { status, data } = await client.api['property-owners'].get({
				query: {
					limit: 2,
					offset: 1,
					sortBy: 'name',
					sortOrder: 'asc',
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(2)
			expect(data?.total).toBe(4)
			expect(data?.data[0].name).toBe('Bruno')
			expect(data?.data[1].name).toBe('Carlos')
		})
	})

	describe('Date Filters', () => {
		it('should filter by createdAtStart', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Today Owner', '12345678909')

			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)

			const { status, data } = await client.api['property-owners'].get({
				query: {
					createdAtStart: yesterday.toISOString(),
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
		})

		it('should filter by createdAtEnd', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Today Owner', '12345678909')

			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)

			const { status, data } = await client.api['property-owners'].get({
				query: {
					createdAtEnd: tomorrow.toISOString(),
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
		})

		it('should filter by date range', async () => {
			const { token, company, owner } = await createUserWithSubscription('owner')
			await createPropertyOwner(company.id, owner.id, 'Today Owner', '12345678909')

			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)

			const { status, data } = await client.api['property-owners'].get({
				query: {
					createdAtStart: yesterday.toISOString(),
					createdAtEnd: tomorrow.toISOString(),
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(200)
			expect(data?.data.length).toBe(1)
		})
	})
})
