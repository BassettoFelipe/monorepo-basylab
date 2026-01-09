import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { TokenBlacklist } from '@/utils/token-blacklist'
import { LogoutUseCase } from './logout.use-case'

describe('LogoutUseCase', () => {
	let useCase: LogoutUseCase

	beforeEach(() => {
		TokenBlacklist.clear()
		useCase = new LogoutUseCase()
	})

	afterEach(() => {
		TokenBlacklist.clear()
	})

	describe('Token Blacklisting', () => {
		test('should blacklist valid access token', async () => {
			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken

			const futureExp = Math.floor(Date.now() / 1000) + 3600

			JwtUtils.verifyToken = mock((_token, type) => {
				if (type === 'access') {
					return Promise.resolve({
						sub: 'user-123',
						exp: futureExp,
						iat: Math.floor(Date.now() / 1000),
					})
				}
				return Promise.resolve({
					sub: 'user-123',
					exp: futureExp,
					iat: Math.floor(Date.now() / 1000),
				})
			})

			try {
				const result = await useCase.execute({
					accessToken: 'valid-access-token',
					refreshToken: 'valid-refresh-token',
				})

				expect(result.success).toBe(true)
				expect(TokenBlacklist.isBlacklisted('valid-access-token')).toBe(true)
				expect(TokenBlacklist.isBlacklisted('valid-refresh-token')).toBe(true)
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})

		test('should throw error when both tokens are invalid', async () => {
			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken

			JwtUtils.verifyToken = mock(() => Promise.resolve(null))

			try {
				await expect(
					useCase.execute({
						accessToken: 'invalid-token',
						refreshToken: 'invalid-token',
					}),
				).rejects.toThrow('Tokens inválidos')
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})

		test('should succeed if only access token is valid', async () => {
			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken

			const futureExp = Math.floor(Date.now() / 1000) + 3600

			JwtUtils.verifyToken = mock((_token, type) => {
				if (type === 'access') {
					return Promise.resolve({
						sub: 'user-123',
						exp: futureExp,
						iat: Math.floor(Date.now() / 1000),
					})
				}
				return Promise.resolve(null)
			})

			try {
				const result = await useCase.execute({
					accessToken: 'valid-access-token',
					refreshToken: 'invalid-refresh-token',
				})

				expect(result.success).toBe(true)
				expect(TokenBlacklist.isBlacklisted('valid-access-token')).toBe(true)
				expect(TokenBlacklist.isBlacklisted('invalid-refresh-token')).toBe(false)
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})

		test('should succeed if only refresh token is valid', async () => {
			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken

			const futureExp = Math.floor(Date.now() / 1000) + 3600

			JwtUtils.verifyToken = mock((_token, type) => {
				if (type === 'refresh') {
					return Promise.resolve({
						sub: 'user-123',
						exp: futureExp,
						iat: Math.floor(Date.now() / 1000),
					})
				}
				return Promise.resolve(null)
			})

			try {
				const result = await useCase.execute({
					accessToken: 'invalid-access-token',
					refreshToken: 'valid-refresh-token',
				})

				expect(result.success).toBe(true)
				expect(TokenBlacklist.isBlacklisted('invalid-access-token')).toBe(false)
				expect(TokenBlacklist.isBlacklisted('valid-refresh-token')).toBe(true)
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})

		test('should not blacklist already expired tokens', async () => {
			const { JwtUtils } = await import('@/utils/jwt.utils')
			const originalVerify = JwtUtils.verifyToken

			const pastExp = Math.floor(Date.now() / 1000) - 100

			JwtUtils.verifyToken = mock(() =>
				Promise.resolve({
					sub: 'user-123',
					exp: pastExp,
					iat: Math.floor(Date.now() / 1000) - 3700,
				}),
			)

			try {
				const result = await useCase.execute({
					accessToken: 'expired-access-token',
					refreshToken: 'expired-refresh-token',
				})

				expect(result.success).toBe(true)
				expect(TokenBlacklist.size()).toBe(0)
			} finally {
				JwtUtils.verifyToken = originalVerify
			}
		})
	})
})
