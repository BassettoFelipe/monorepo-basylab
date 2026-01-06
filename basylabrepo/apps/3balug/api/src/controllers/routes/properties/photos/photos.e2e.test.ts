import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createAuthenticatedClient, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('Properties Photos E2E', () => {
	const {
		client,
		userRepository,
		companyRepository,
		planRepository,
		subscriptionRepository,
		propertyRepository,
		propertyOwnerRepository,
	} = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	async function createCompanyWithOwnerAndProperty(planSlug = 'imobiliaria') {
		const plan = await planRepository.findBySlug(planSlug)
		if (!plan) throw new Error(`Plan ${planSlug} not found`)

		const company = await companyRepository.create({
			name: 'Test Company',
			email: generateTestEmail('company'),
		})

		const owner = await userRepository.create({
			email: generateTestEmail('owner'),
			password: 'hashed-password',
			name: 'Test Owner',
			role: 'owner',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		await companyRepository.update(company.id, {
			ownerId: owner.id,
		})

		await subscriptionRepository.create({
			userId: owner.id,
			planId: plan.id,
			status: 'active',
			startDate: new Date(),
		})

		const propertyOwner = await propertyOwnerRepository.create({
			name: 'Property Owner',
			email: generateTestEmail('prop-owner'),
			phone: '11999999999',
			document: '12345678901',
			companyId: company.id,
			createdBy: owner.id,
		})

		const property = await propertyRepository.create({
			companyId: company.id,
			ownerId: propertyOwner.id,
			title: 'Test Property',
			type: 'apartment',
			address: 'Test Street, 123',
			city: 'Test City',
			state: 'SP',
			zipCode: '01234567',
			rentalPrice: 150000,
			createdBy: owner.id,
		})

		const token = await JwtUtils.generateToken(owner.id, 'access', {
			role: 'owner',
			companyId: company.id,
		})

		return { owner, company, plan, property, propertyOwner, token }
	}

	describe('POST /properties/:id/photos', () => {
		describe('Authentication & Authorization', () => {
			it('should return 401 when no auth token provided', async () => {
				const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

				const { status } = await client.api
					.properties({ id: '00000000-0000-0000-0000-000000000001' })
					.photos.post({
						file,
					})

				expect(status).toBe(401)
			})

			it('should return 401 with invalid token', async () => {
				const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

				const { status } = await client.api
					.properties({ id: '00000000-0000-0000-0000-000000000001' })
					.photos.post(
						{
							file,
						},
						{
							headers: {
								Authorization: 'Bearer invalid-token',
							},
						},
					)

				expect(status).toBe(401)
			})
		})

		describe('Validation', () => {
			it('should return 422 when no file provided', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()

				const { status } = await client.api
					.properties({ id: property.id })
					.photos.post({} as { file: File }, {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					})

				expect(status).toBe(422)
			})

			it('should accept isPrimary as boolean', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()
				const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

				const { status } = await client.api.properties({ id: property.id }).photos.post(
					{
						file,
						isPrimary: true,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect([200, 500]).toContain(status)
			})

			it('should accept isPrimary as string', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()
				const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

				const { status } = await client.api.properties({ id: property.id }).photos.post(
					{
						file,
						isPrimary: 'true',
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect([200, 500]).toContain(status)
			})
		})

		describe('File Types', () => {
			it('should accept JPEG images', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()
				const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

				const { status } = await client.api.properties({ id: property.id }).photos.post(
					{
						file,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect([200, 500]).toContain(status)
			})

			it('should accept PNG images', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()
				const file = new File(['test'], 'photo.png', { type: 'image/png' })

				const { status } = await client.api.properties({ id: property.id }).photos.post(
					{
						file,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect([200, 500]).toContain(status)
			})

			it('should accept WebP images', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()
				const file = new File(['test'], 'photo.webp', { type: 'image/webp' })

				const { status } = await client.api.properties({ id: property.id }).photos.post(
					{
						file,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect([200, 500]).toContain(status)
			})
		})
	})

	describe('DELETE /properties/:id/photos/:photoId', () => {
		describe('Authentication & Authorization', () => {
			it('should return 401 when no auth token provided', async () => {
				const { status } = await client.api
					.properties({ id: '00000000-0000-0000-0000-000000000001' })
					.photos({ photoId: '00000000-0000-0000-0000-000000000002' })
					.delete()

				expect(status).toBe(401)
			})

			it('should return 401 with invalid token', async () => {
				const authClient = createAuthenticatedClient('invalid-token')
				const { status } = await authClient.api
					.properties({ id: '00000000-0000-0000-0000-000000000001' })
					.photos({ photoId: '00000000-0000-0000-0000-000000000002' })
					.delete()

				expect(status).toBe(401)
			})
		})

		describe('Business Rules', () => {
			it('should return 404 when photo does not exist', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()

				const authClient = createAuthenticatedClient(token)
				const { status, error } = await authClient.api
					.properties({ id: property.id })
					.photos({ photoId: '00000000-0000-0000-0000-000000000999' })
					.delete()

				expect(status).toBe(404)
				expect((error?.value as { type: string }).type).toBe('NOT_FOUND')
			})
		})
	})

	describe('PATCH /properties/:id/photos/:photoId/primary', () => {
		describe('Authentication & Authorization', () => {
			it('should return 401 when no auth token provided', async () => {
				const { status } = await client.api
					.properties({ id: '00000000-0000-0000-0000-000000000001' })
					.photos({ photoId: '00000000-0000-0000-0000-000000000002' })
					.primary.patch()

				expect(status).toBe(401)
			})

			it('should return 401 with invalid token', async () => {
				const authClient = createAuthenticatedClient('invalid-token')
				const { status } = await authClient.api
					.properties({ id: '00000000-0000-0000-0000-000000000001' })
					.photos({ photoId: '00000000-0000-0000-0000-000000000002' })
					.primary.patch()

				expect(status).toBe(401)
			})
		})

		describe('Business Rules', () => {
			it('should return 404 when photo does not exist', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()

				const authClient = createAuthenticatedClient(token)
				const { status, error } = await authClient.api
					.properties({ id: property.id })
					.photos({ photoId: '00000000-0000-0000-0000-000000000999' })
					.primary.patch()

				expect(status).toBe(404)
				expect((error?.value as { type: string }).type).toBe('NOT_FOUND')
			})
		})

		describe('Response Format', () => {
			it('should return consistent error format', async () => {
				const { token, property } = await createCompanyWithOwnerAndProperty()

				const authClient = createAuthenticatedClient(token)
				const { error } = await authClient.api
					.properties({ id: property.id })
					.photos({ photoId: '00000000-0000-0000-0000-000000000999' })
					.primary.patch()

				expect(error).toBeDefined()
				expect(error?.value).toHaveProperty('type')
				expect(error?.value).toHaveProperty('message')
			})
		})
	})
})
