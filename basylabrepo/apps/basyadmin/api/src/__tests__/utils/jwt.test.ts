import { describe, expect, test } from 'bun:test'

// Set environment variables before imports
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-do-not-use-in-production'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/basyadmin_test'

import { signAccessToken, signRefreshToken, type TokenPayload, verifyToken } from '../../utils/jwt'

describe('JWT Utils', () => {
	const testPayload: TokenPayload = {
		userId: '123e4567-e89b-12d3-a456-426614174000',
		email: 'test@example.com',
		role: 'owner',
	}

	describe('signAccessToken', () => {
		test('should generate a valid access token', async () => {
			const token = await signAccessToken(testPayload)

			expect(token).toBeDefined()
			expect(typeof token).toBe('string')
			expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
		})

		test('should generate different tokens for different payloads', async () => {
			const token1 = await signAccessToken(testPayload)
			const token2 = await signAccessToken({
				...testPayload,
				userId: 'different-user-id',
			})

			expect(token1).not.toBe(token2)
		})
	})

	describe('signRefreshToken', () => {
		test('should generate a valid refresh token', async () => {
			const token = await signRefreshToken(testPayload)

			expect(token).toBeDefined()
			expect(typeof token).toBe('string')
			expect(token.split('.')).toHaveLength(3)
		})

		test('should generate different tokens than access tokens', async () => {
			const accessToken = await signAccessToken(testPayload)
			const refreshToken = await signRefreshToken(testPayload)

			expect(accessToken).not.toBe(refreshToken)
		})
	})

	describe('verifyToken', () => {
		test('should verify and decode a valid access token', async () => {
			const token = await signAccessToken(testPayload)
			const decoded = await verifyToken(token)

			expect(decoded.userId).toBe(testPayload.userId)
			expect(decoded.email).toBe(testPayload.email)
			expect(decoded.role).toBe(testPayload.role)
		})

		test('should verify and decode a valid refresh token', async () => {
			const token = await signRefreshToken(testPayload)
			const decoded = await verifyToken(token)

			expect(decoded.userId).toBe(testPayload.userId)
			expect(decoded.email).toBe(testPayload.email)
			expect(decoded.role).toBe(testPayload.role)
		})

		test('should throw error for invalid token', async () => {
			const invalidToken = 'invalid.token.here'

			expect(verifyToken(invalidToken)).rejects.toThrow()
		})

		test('should throw error for tampered token', async () => {
			const token = await signAccessToken(testPayload)
			const tamperedToken = `${token.slice(0, -5)}xxxxx`

			expect(verifyToken(tamperedToken)).rejects.toThrow()
		})
	})

	describe('token payload preservation', () => {
		test('should preserve role in token', async () => {
			const ownerPayload: TokenPayload = { ...testPayload, role: 'owner' }
			const managerPayload: TokenPayload = { ...testPayload, role: 'manager' }

			const ownerToken = await signAccessToken(ownerPayload)
			const managerToken = await signAccessToken(managerPayload)

			const decodedOwner = await verifyToken(ownerToken)
			const decodedManager = await verifyToken(managerToken)

			expect(decodedOwner.role).toBe('owner')
			expect(decodedManager.role).toBe('manager')
		})

		test('should preserve email in token', async () => {
			const token = await signAccessToken(testPayload)
			const decoded = await verifyToken(token)

			expect(decoded.email).toBe(testPayload.email)
		})
	})
})
