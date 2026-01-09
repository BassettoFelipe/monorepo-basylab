import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { auth } from '@/container'
import { createTestApp } from '@/test/setup'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET /auth/me', () => {
	const { client } = createTestApp()

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		role: 'student' as const,
		phone: '+5511999999999',
		avatarUrl: 'https://example.com/avatar.jpg',
		isEmailVerified: true,
		createdAt: new Date('2024-01-01'),
	}

	const mockGetMeExecute = spyOn(auth.getMe, 'execute')
	const mockVerifyToken = spyOn(JwtUtils, 'verifyToken')

	beforeEach(() => {
		mockGetMeExecute.mockClear()
		mockVerifyToken.mockClear()
	})

	afterAll(() => {
		mockGetMeExecute.mockRestore()
		mockVerifyToken.mockRestore()
	})

	describe('successful get me', () => {
		it('should return user data with valid token', async () => {
			mockVerifyToken.mockResolvedValue({
				sub: 'user-123',
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
				role: 'student',
			})
			mockGetMeExecute.mockResolvedValue(mockUser)

			const response = await client.auth.me.get({
				headers: {
					authorization: 'Bearer valid-access-token',
				},
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data.id).toBe(mockUser.id)
			expect(response.data?.data.email).toBe(mockUser.email)
			expect(response.data?.data.name).toBe(mockUser.name)
		})
	})
})
