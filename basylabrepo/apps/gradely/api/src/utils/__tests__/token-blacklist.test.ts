import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { TokenBlacklist } from '../token-blacklist'

describe('TokenBlacklist', () => {
	beforeEach(() => {
		TokenBlacklist.clear()
	})

	afterEach(() => {
		TokenBlacklist.clear()
	})

	describe('add', () => {
		test('should add token to blacklist', () => {
			TokenBlacklist.add('token-123', 3600)

			expect(TokenBlacklist.isBlacklisted('token-123')).toBe(true)
		})

		test('should store multiple tokens', () => {
			TokenBlacklist.add('token-1', 3600)
			TokenBlacklist.add('token-2', 3600)
			TokenBlacklist.add('token-3', 3600)

			expect(TokenBlacklist.size()).toBe(3)
			expect(TokenBlacklist.isBlacklisted('token-1')).toBe(true)
			expect(TokenBlacklist.isBlacklisted('token-2')).toBe(true)
			expect(TokenBlacklist.isBlacklisted('token-3')).toBe(true)
		})
	})

	describe('isBlacklisted', () => {
		test('should return true for blacklisted token', () => {
			TokenBlacklist.add('blacklisted-token', 3600)

			expect(TokenBlacklist.isBlacklisted('blacklisted-token')).toBe(true)
		})

		test('should return false for non-blacklisted token', () => {
			expect(TokenBlacklist.isBlacklisted('unknown-token')).toBe(false)
		})

		test('should return false and remove expired token', () => {
			TokenBlacklist.add('expired-token', -1)

			expect(TokenBlacklist.isBlacklisted('expired-token')).toBe(false)
			expect(TokenBlacklist.size()).toBe(0)
		})
	})

	describe('remove', () => {
		test('should remove token from blacklist', () => {
			TokenBlacklist.add('token-to-remove', 3600)
			expect(TokenBlacklist.isBlacklisted('token-to-remove')).toBe(true)

			TokenBlacklist.remove('token-to-remove')

			expect(TokenBlacklist.isBlacklisted('token-to-remove')).toBe(false)
		})

		test('should not throw when removing non-existent token', () => {
			expect(() => TokenBlacklist.remove('non-existent')).not.toThrow()
		})
	})

	describe('clear', () => {
		test('should remove all tokens from blacklist', () => {
			TokenBlacklist.add('token-1', 3600)
			TokenBlacklist.add('token-2', 3600)
			TokenBlacklist.add('token-3', 3600)

			expect(TokenBlacklist.size()).toBe(3)

			TokenBlacklist.clear()

			expect(TokenBlacklist.size()).toBe(0)
		})
	})

	describe('size', () => {
		test('should return correct size', () => {
			expect(TokenBlacklist.size()).toBe(0)

			TokenBlacklist.add('token-1', 3600)
			expect(TokenBlacklist.size()).toBe(1)

			TokenBlacklist.add('token-2', 3600)
			expect(TokenBlacklist.size()).toBe(2)
		})
	})
})
