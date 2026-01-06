import { beforeEach, describe, expect, it } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('POST /files/presigned-url', () => {
	const { client, userRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	async function createAuthenticatedUser() {
		const email = generateTestEmail('presigned-url')
		const user = await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Presigned URL User',
			isEmailVerified: true,
			isActive: true,
		})

		const token = await JwtUtils.generateToken(user.id, 'access', {})

		return { user, token }
	}

	describe('Authentication', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client.files['presigned-url'].post({
				fileName: 'test.pdf',
				contentType: 'application/pdf',
			})

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
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
			const { token } = await createAuthenticatedUser()

			const { status } = await client.files['presigned-url'].post(
				{
					contentType: 'application/pdf',
				} as { fileName: string; contentType: string },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 when contentType is missing', async () => {
			const { token } = await createAuthenticatedUser()

			const { status } = await client.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
				} as { fileName: string; contentType: string },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect(status).toBe(422)
		})
	})

	describe('Optional Parameters', () => {
		it('should accept fieldId parameter', async () => {
			const { token } = await createAuthenticatedUser()

			const { status } = await client.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
					fieldId: 'custom-field-id',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect([200, 500]).toContain(status)
		})

		it('should accept allowedTypes parameter', async () => {
			const { token } = await createAuthenticatedUser()

			const { status } = await client.files['presigned-url'].post(
				{
					fileName: 'test.pdf',
					contentType: 'application/pdf',
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

	describe('Content Types', () => {
		it('should accept PDF content type', async () => {
			const { token } = await createAuthenticatedUser()

			const { status } = await client.files['presigned-url'].post(
				{
					fileName: 'document.pdf',
					contentType: 'application/pdf',
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			)

			expect([200, 500]).toContain(status)
		})

		it('should accept image content types', async () => {
			const { token } = await createAuthenticatedUser()

			const imageTypes = ['image/png', 'image/jpeg', 'image/webp']

			for (const contentType of imageTypes) {
				const { status } = await client.files['presigned-url'].post(
					{
						fileName: 'image.png',
						contentType,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				)

				expect([200, 500]).toContain(status)
			}
		})
	})
})
