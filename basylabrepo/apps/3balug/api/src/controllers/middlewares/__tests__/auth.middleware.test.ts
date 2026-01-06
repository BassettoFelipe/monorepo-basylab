import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { Elysia } from 'elysia'
import { errorHandlerPlugin } from '@/plugins/error-handler.plugin'
import { createAuthMiddleware } from '../auth.middleware'

// Create mock verifyToken function (no global module mocking)
const mockVerifyToken = mock(() => Promise.resolve(null)) as any

describe('auth.middleware', () => {
	let app: any

	beforeEach(() => {
		mockVerifyToken.mockReset()

		app = new Elysia()
			.use(errorHandlerPlugin)
			.use(createAuthMiddleware(mockVerifyToken))
			.get('/protected', ({ userId, userRole, userCompanyId }) => ({
				userId,
				userRole,
				userCompanyId,
			}))
	})

	describe('requireAuth', () => {
		test('should return 401 when no authorization header is provided', async () => {
			const response = await app.handle(new Request('http://localhost/protected'))

			expect(response.status).toBe(401)
			const body = (await response.json()) as any
			expect(body.type).toBe('AUTHENTICATION_REQUIRED')
		})

		test('should return 401 when authorization header is empty', async () => {
			const response = await app.handle(
				new Request('http://localhost/protected', {
					headers: { authorization: '' },
				}),
			)

			expect(response.status).toBe(401)
			const body = (await response.json()) as any
			expect(body.type).toBe('AUTHENTICATION_REQUIRED')
		})

		test('should return 401 when token type is not Bearer', async () => {
			const response = await app.handle(
				new Request('http://localhost/protected', {
					headers: { authorization: 'Basic some-token' },
				}),
			)

			expect(response.status).toBe(401)
			const body = (await response.json()) as any
			expect(body.type).toBe('INVALID_TOKEN')
		})

		test('should return 401 when Bearer token is missing', async () => {
			const response = await app.handle(
				new Request('http://localhost/protected', {
					headers: { authorization: 'Bearer' },
				}),
			)

			expect(response.status).toBe(401)
			const body = (await response.json()) as any
			expect(body.type).toBe('INVALID_TOKEN')
		})

		test('should return 401 when Bearer token has extra parts', async () => {
			const response = await app.handle(
				new Request('http://localhost/protected', {
					headers: { authorization: 'Bearer token extra' },
				}),
			)

			expect(response.status).toBe(401)
			const body = (await response.json()) as any
			expect(body.type).toBe('INVALID_TOKEN')
		})

		test('should return 401 when token is expired or invalid', async () => {
			mockVerifyToken.mockResolvedValue(null)

			const response = await app.handle(
				new Request('http://localhost/protected', {
					headers: { authorization: 'Bearer expired-token' },
				}),
			)

			expect(response.status).toBe(401)
			const body = (await response.json()) as any
			expect(body.type).toBe('TOKEN_EXPIRED')
		})

		test('should derive user context when token is valid', async () => {
			const mockPayload = {
				sub: 'user-123',
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
				role: 'owner',
				companyId: 'company-456',
			}
			mockVerifyToken.mockResolvedValue(mockPayload)

			const response = await app.handle(
				new Request('http://localhost/protected', {
					headers: { authorization: 'Bearer valid-token' },
				}),
			)

			expect(response.status).toBe(200)
			const body = (await response.json()) as any
			expect(body.userId).toBe('user-123')
			expect(body.userRole).toBe('owner')
			expect(body.userCompanyId).toBe('company-456')
		})

		test('should handle token without role and companyId', async () => {
			const mockPayload = {
				sub: 'user-123',
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
			}
			mockVerifyToken.mockResolvedValue(mockPayload)

			const response = await app.handle(
				new Request('http://localhost/protected', {
					headers: { authorization: 'Bearer valid-token' },
				}),
			)

			expect(response.status).toBe(200)
			const body = (await response.json()) as any
			expect(body.userId).toBe('user-123')
			expect(body.userRole).toBeNull()
			expect(body.userCompanyId).toBeNull()
		})

		test('should call verifyToken with correct parameters', async () => {
			const mockPayload = {
				sub: 'user-123',
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
			}
			mockVerifyToken.mockResolvedValue(mockPayload)

			await app.handle(
				new Request('http://localhost/protected', {
					headers: { authorization: 'Bearer my-test-token' },
				}),
			)

			expect(mockVerifyToken).toHaveBeenCalledWith('my-test-token', 'access')
		})
	})
})
