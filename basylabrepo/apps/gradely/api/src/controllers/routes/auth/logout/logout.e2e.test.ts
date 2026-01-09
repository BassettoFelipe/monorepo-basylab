import { afterAll, afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { auth } from '@/container'
import { createTestApp } from '@/test/setup'
import { JwtUtils } from '@/utils/jwt.utils'
import { TokenBlacklist } from '@/utils/token-blacklist'

describe('POST /auth/logout', () => {
	const { client } = createTestApp()

	const mockLogoutExecute = spyOn(auth.logout, 'execute')
	const mockVerifyToken = spyOn(JwtUtils, 'verifyToken')

	beforeEach(() => {
		mockLogoutExecute.mockClear()
		mockVerifyToken.mockClear()
		TokenBlacklist.clear()
	})

	afterAll(() => {
		mockLogoutExecute.mockRestore()
		mockVerifyToken.mockRestore()
		TokenBlacklist.clear()
	})

	afterEach(() => {
		TokenBlacklist.clear()
	})

	describe('successful logout', () => {
		it('should logout successfully with valid tokens', async () => {
			mockVerifyToken.mockResolvedValue({
				sub: 'user-123',
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
				role: 'student',
			})
			mockLogoutExecute.mockResolvedValue({ success: true })

			const response = await client.auth.logout.post(
				{
					refreshToken: 'valid-refresh-token',
				},
				{
					headers: {
						authorization: 'Bearer valid-access-token',
					},
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data.success).toBe(true)
		})

		it('should call logout use case with correct tokens', async () => {
			mockVerifyToken.mockResolvedValue({
				sub: 'user-123',
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
				role: 'student',
			})
			mockLogoutExecute.mockResolvedValue({ success: true })

			await client.auth.logout.post(
				{
					refreshToken: 'my-refresh-token',
				},
				{
					headers: {
						authorization: 'Bearer my-access-token',
					},
				},
			)

			expect(mockLogoutExecute).toHaveBeenCalledWith({
				accessToken: 'my-access-token',
				refreshToken: 'my-refresh-token',
			})
		})
	})
})
