import { afterAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { auth } from '@/container'
import { createTestApp } from '@/test/setup'

describe('POST /auth/refresh', () => {
	const { client } = createTestApp()

	const mockRefreshExecute = spyOn(auth.refreshToken, 'execute')

	beforeEach(() => {
		mockRefreshExecute.mockClear()
	})

	afterAll(() => {
		mockRefreshExecute.mockRestore()
	})

	describe('successful refresh', () => {
		it('should refresh tokens successfully', async () => {
			mockRefreshExecute.mockResolvedValue({
				accessToken: 'new-access-token',
				refreshToken: 'new-refresh-token',
			})

			const response = await client.auth.refresh.post({
				refreshToken: 'valid-refresh-token',
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data.accessToken).toBe('new-access-token')
			expect(response.data?.data.refreshToken).toBe('new-refresh-token')
		})
	})
})
