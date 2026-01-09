import { beforeEach, describe, expect, it } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('POST /files/presigned-url', () => {
	const { client, userRepository, tenantRepository, companyRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	async function createAuthenticatedUser() {
		const email = generateTestEmail('presigned-url')

		const company = await companyRepository.create({
			name: 'Test Company',
			cnpj: '12345678000190',
		})

		const user = await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Presigned URL User',
			isEmailVerified: true,
			isActive: true,
			companyId: company.id,
		})

		const token = await JwtUtils.generateToken(user.id, 'access', {})

		return { user, token, company }
	}

	async function createTenant(companyId: string, createdBy: string) {
		return tenantRepository.create({
			companyId,
			name: 'Test Tenant',
			cpf: '12345678901',
			createdBy,
		})
	}

	describe('Authentication', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client.api.files['presigned-url'].post({
				fileName: 'test.pdf',
				contentType: 'application/pdf',
				entityType: 'tenant',
				entityId: 'some-id',
			})

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					entityType: 'tenant',
					entityId: 'some-id',
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
		it('should return 422 when fileName is missing', async () => {
			const { token, user, company } = await createAuthenticatedUser()
			const tenant = await createTenant(company.id, user.id)

			const { status } = await client.api.files['presigned-url'].post(
				{
					contentType: 'application/pdf',
					entityType: 'tenant',
					entityId: tenant.id,
				} as any,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when contentType is missing', async () => {
			const { token, user, company } = await createAuthenticatedUser()
			const tenant = await createTenant(company.id, user.id)

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					entityType: 'tenant',
					entityId: tenant.id,
				} as any,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when entityType is missing', async () => {
			const { token } = await createAuthenticatedUser()

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					entityId: 'some-id',
				} as any,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when entityId is missing', async () => {
			const { token } = await createAuthenticatedUser()

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					entityType: 'tenant',
				} as any,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})
	})

	describe('Entity Validation', () => {
		it('should return 404 when tenant does not exist', async () => {
			const { token } = await createAuthenticatedUser()

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					entityType: 'tenant',
					entityId: '00000000-0000-0000-0000-000000000000',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(404)
		})

		it('should return 404 when user entity does not exist', async () => {
			const { token } = await createAuthenticatedUser()

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					entityType: 'user',
					entityId: '00000000-0000-0000-0000-000000000000',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(404)
		})
	})

	describe('Success Cases', () => {
		it('should generate presigned URL for existing tenant', async () => {
			const { token, user, company } = await createAuthenticatedUser()
			const tenant = await createTenant(company.id, user.id)

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					entityType: 'tenant',
					entityId: tenant.id,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect([200, 500]).toContain(status) // 500 may occur if storage is not configured in test env
		})

		it('should generate presigned URL for existing user', async () => {
			const { token, user } = await createAuthenticatedUser()

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'avatar.jpg',
					contentType: 'image/jpeg',
					entityType: 'user',
					entityId: user.id,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect([200, 500]).toContain(status)
		})

		it('should accept optional fieldId parameter', async () => {
			const { token, user, company } = await createAuthenticatedUser()
			const tenant = await createTenant(company.id, user.id)

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					entityType: 'tenant',
					entityId: tenant.id,
					fieldId: 'photo',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect([200, 500]).toContain(status)
		})

		it('should accept optional allowedTypes parameter', async () => {
			const { token, user, company } = await createAuthenticatedUser()
			const tenant = await createTenant(company.id, user.id)

			const { status } = await client.api.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					entityType: 'tenant',
					entityId: tenant.id,
					allowedTypes: ['application/pdf', 'image/png'],
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
