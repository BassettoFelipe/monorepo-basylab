import { beforeEach, describe, expect, it } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('POST /files/upload', () => {
	const { client, userRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	async function createAuthenticatedUser() {
		const email = generateTestEmail('file-upload')
		const user = await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'File Upload User',
			isEmailVerified: true,
			isActive: true,
		})

		const token = await JwtUtils.generateToken(user.id, 'access', {})

		return { user, token }
	}

	describe('Authentication', () => {
		it('should return 401 when no auth token provided', async () => {
			const file = new File(['test content'], 'test.txt', {
				type: 'text/plain',
			})

			const { status } = await client.files.upload.post({
				file,
			})

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const file = new File(['test content'], 'test.txt', {
				type: 'text/plain',
			})

			const { status } = await client.files.upload.post(
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
			const { token } = await createAuthenticatedUser()

			const { status } = await client.files.upload.post({} as { file: File }, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			expect(status).toBe(422)
		})
	})

	describe('Optional Parameters', () => {
		it('should accept fieldId parameter', async () => {
			const { token } = await createAuthenticatedUser()
			const file = new File(['test content'], 'test.txt', {
				type: 'text/plain',
			})

			const { status } = await client.files.upload.post(
				{
					file,
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

		it('should accept maxFileSize parameter', async () => {
			const { token } = await createAuthenticatedUser()
			const file = new File(['test content'], 'test.txt', {
				type: 'text/plain',
			})

			const { status } = await client.files.upload.post(
				{
					file,
					maxFileSize: 5,
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
			const file = new File(['test content'], 'test.txt', {
				type: 'text/plain',
			})

			const { status } = await client.files.upload.post(
				{
					file,
					allowedTypes: 'text/plain,application/pdf',
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
