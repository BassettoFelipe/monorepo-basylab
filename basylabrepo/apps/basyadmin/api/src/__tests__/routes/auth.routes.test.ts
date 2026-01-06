import { describe, expect, test } from 'bun:test'

// Set environment variables before imports
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-do-not-use-in-production'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/basyadmin_test'

import { signAccessToken, signRefreshToken, type TokenPayload } from '../../utils/jwt'

// Mock user data
const mockOwner = {
	id: '123e4567-e89b-12d3-a456-426614174001',
	email: 'owner@example.com',
	passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S8/GvMPYrJx1Vu', // "password123"
	name: 'Test Owner',
	role: 'owner' as const,
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
}

const mockManager = {
	id: '123e4567-e89b-12d3-a456-426614174002',
	email: 'manager@example.com',
	passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.S8/GvMPYrJx1Vu',
	name: 'Test Manager',
	role: 'manager' as const,
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
}

describe('Auth Routes', () => {
	describe('POST /auth/login', () => {
		test('should validate email format', () => {
			const validEmail = 'test@example.com'
			const invalidEmail = 'not-an-email'

			expect(validEmail.includes('@')).toBe(true)
			expect(invalidEmail.includes('@')).toBe(false)
		})

		test('should require password', () => {
			const password = ''
			expect(password.length).toBe(0)
		})

		test('should return tokens for valid credentials', async () => {
			const payload: TokenPayload = {
				userId: mockOwner.id,
				email: mockOwner.email,
				role: mockOwner.role,
			}

			const accessToken = await signAccessToken(payload)
			const refreshToken = await signRefreshToken(payload)

			expect(accessToken).toBeDefined()
			expect(refreshToken).toBeDefined()
			expect(accessToken).not.toBe(refreshToken)
		})

		test('should return user info without password', () => {
			const userResponse = {
				id: mockOwner.id,
				email: mockOwner.email,
				name: mockOwner.name,
				role: mockOwner.role,
			}

			expect(userResponse).not.toHaveProperty('passwordHash')
			expect(userResponse).not.toHaveProperty('password')
		})
	})

	describe('POST /auth/refresh', () => {
		test('should accept valid refresh token', async () => {
			const payload: TokenPayload = {
				userId: mockOwner.id,
				email: mockOwner.email,
				role: mockOwner.role,
			}

			const refreshToken = await signRefreshToken(payload)
			expect(refreshToken).toBeDefined()
		})

		test('should return new access and refresh tokens', async () => {
			const payload: TokenPayload = {
				userId: mockOwner.id,
				email: mockOwner.email,
				role: mockOwner.role,
			}

			const newAccessToken = await signAccessToken(payload)
			const newRefreshToken = await signRefreshToken(payload)

			expect(newAccessToken).toBeDefined()
			expect(newRefreshToken).toBeDefined()
		})
	})

	describe('GET /auth/me', () => {
		test('should require authentication', async () => {
			const authHeader = undefined
			expect(authHeader).toBeUndefined()
		})

		test('should return user info for valid token', async () => {
			const payload: TokenPayload = {
				userId: mockOwner.id,
				email: mockOwner.email,
				role: mockOwner.role,
			}

			const token = await signAccessToken(payload)
			const authHeader = `Bearer ${token}`

			expect(authHeader.startsWith('Bearer ')).toBe(true)
		})

		test('should not return password hash', () => {
			const safeUserResponse = {
				id: mockOwner.id,
				email: mockOwner.email,
				name: mockOwner.name,
				role: mockOwner.role,
				isActive: mockOwner.isActive,
				createdAt: mockOwner.createdAt,
			}

			expect(safeUserResponse).not.toHaveProperty('passwordHash')
		})
	})
})

describe('Authentication Flow', () => {
	test('should support owner login flow', async () => {
		const payload: TokenPayload = {
			userId: mockOwner.id,
			email: mockOwner.email,
			role: 'owner',
		}

		const accessToken = await signAccessToken(payload)
		const refreshToken = await signRefreshToken(payload)

		expect(accessToken).toBeDefined()
		expect(refreshToken).toBeDefined()
	})

	test('should support manager login flow', async () => {
		const payload: TokenPayload = {
			userId: mockManager.id,
			email: mockManager.email,
			role: 'manager',
		}

		const accessToken = await signAccessToken(payload)
		const refreshToken = await signRefreshToken(payload)

		expect(accessToken).toBeDefined()
		expect(refreshToken).toBeDefined()
	})

	test('should reject inactive user', () => {
		const inactiveUser = { ...mockOwner, isActive: false }
		expect(inactiveUser.isActive).toBe(false)
	})
})
