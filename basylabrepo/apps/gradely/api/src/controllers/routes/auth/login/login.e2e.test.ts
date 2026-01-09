import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { auth } from '@/container'
import { createTestApp } from '@/test/setup'

describe('POST /auth/login', () => {
	const { client } = createTestApp()

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		role: 'student',
	}

	const mockLoginExecute = spyOn(auth.login, 'execute')

	beforeEach(() => {
		mockLoginExecute.mockClear()
	})

	afterAll(() => {
		mockLoginExecute.mockRestore()
	})

	describe('successful login', () => {
		it('should login successfully with valid credentials', async () => {
			mockLoginExecute.mockResolvedValue({
				user: mockUser,
				accessToken: 'mock-access-token',
				refreshToken: 'mock-refresh-token',
			})

			const response = await client.auth.login.post({
				email: 'test@example.com',
				password: 'ValidPass123',
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data.user.email).toBe(mockUser.email)
			expect(response.data?.data.accessToken).toBe('mock-access-token')
			expect(response.data?.data.refreshToken).toBe('mock-refresh-token')
		})
	})

	describe('validation errors', () => {
		it('should reject invalid email format', async () => {
			const response = await client.auth.login.post({
				email: 'invalid-email',
				password: 'ValidPass123',
			})

			expect(response.status).toBe(422)
		})

		it('should reject short password', async () => {
			const response = await client.auth.login.post({
				email: 'test@example.com',
				password: '123',
			})

			expect(response.status).toBe(422)
		})
	})
})
