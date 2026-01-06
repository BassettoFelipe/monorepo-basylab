import { afterAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import * as emailServiceModule from '@/services/email'
import { clearTestData, createTestApp } from '@/test/setup'
import { addMinutes, generateTestEmail } from '@/test/test-helpers'
import { TotpUtils } from '@/utils/totp.utils'

// Mock do email service
const mockSendPasswordResetCode = mock(() => Promise.resolve())

const mockEmailService = {
	sendPasswordResetCode: mockSendPasswordResetCode,
	verifyConnection: mock(() => Promise.resolve(true)),
}

const mockGetEmailServiceInstance = spyOn(
	emailServiceModule,
	'getEmailServiceInstance',
).mockReturnValue(mockEmailService as any)

describe('GET /auth/password-reset-status', () => {
	const { client, userRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
		mockSendPasswordResetCode.mockClear()
	})

	afterAll(() => {
		mockGetEmailServiceInstance.mockRestore()
	})

	it('should send first email and return initial status when no active code exists', async () => {
		const email = generateTestEmail('first-reset')

		await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Test User',
			isEmailVerified: true,
		})

		const { data, status, error } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		expect(status).toBe(200)
		expect(error).toBeFalsy()
		expect(data).toBeDefined()
		expect(data?.canResend).toBe(true)
		expect(data?.remainingResendAttempts).toBe(5)
		expect(data?.canResendAt).toBeNull()
		expect(data?.remainingCodeAttempts).toBe(5)
		expect(data?.canTryCodeAt).toBeNull()
		expect(data?.isResendBlocked).toBe(false)
		expect(data?.resendBlockedUntil).toBeNull()
		expect(data?.codeExpiresAt).toBeDefined()
	})

	it('should return status when active code exists without sending new email', async () => {
		const email = generateTestEmail('active-code')
		const secret = TotpUtils.generateSecret()

		await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Test User',
			isEmailVerified: true,
			passwordResetSecret: secret,
			passwordResetExpiresAt: addMinutes(new Date(), 5),
			passwordResetResendCount: 1,
		})

		const { data, status } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		expect(status).toBe(200)
		expect(data?.remainingResendAttempts).toBe(4)
		expect(data?.remainingCodeAttempts).toBe(5)
	})

	it('should indicate cooldown when recently resent', async () => {
		const email = generateTestEmail('cooldown')
		const cooldownEndsAt = addMinutes(new Date(), 1)

		await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Cooldown User',
			isEmailVerified: true,
			passwordResetSecret: TotpUtils.generateSecret(),
			passwordResetExpiresAt: addMinutes(new Date(), 5),
			passwordResetResendCount: 1,
			passwordResetCooldownEndsAt: cooldownEndsAt,
		})

		const { data, status } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		expect(status).toBe(200)
		expect(data?.canResend).toBe(false)
		expect(data?.canResendAt).toBeTruthy()
		if (data?.canResendAt) {
			expect(new Date(data.canResendAt).getTime()).toBeGreaterThan(Date.now())
		}
	})

	it('should indicate when resend is blocked', async () => {
		const email = generateTestEmail('blocked')
		const blockedUntil = addMinutes(new Date(), 30)

		await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Blocked User',
			isEmailVerified: true,
			passwordResetSecret: TotpUtils.generateSecret(),
			passwordResetExpiresAt: addMinutes(new Date(), 5),
			passwordResetResendBlocked: true,
			passwordResetResendBlockedUntil: blockedUntil,
		})

		const { data, status } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		expect(status).toBe(200)
		expect(data?.isResendBlocked).toBe(true)
		expect(data?.canResend).toBe(false)
		expect(data?.remainingResendAttempts).toBe(0)
		expect(data?.resendBlockedUntil).toBeDefined()
	})

	it('should show throttle delay after failed code attempts', async () => {
		const email = generateTestEmail('throttled')
		const lastAttemptAt = new Date()

		await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Throttled User',
			isEmailVerified: true,
			passwordResetSecret: TotpUtils.generateSecret(),
			passwordResetExpiresAt: addMinutes(new Date(), 5),
			passwordResetAttempts: 3,
			passwordResetLastAttemptAt: lastAttemptAt,
		})

		const { data, status } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		expect(status).toBe(200)
		expect(data?.remainingCodeAttempts).toBe(2)
		if (data?.canTryCodeAt) {
			expect(new Date(data.canTryCodeAt).getTime()).toBeGreaterThanOrEqual(Date.now())
		}
	})

	it('should reject request for non-existent user', async () => {
		const { status, error } = await client.auth['password-reset-status'].get({
			query: { email: 'nonexistent@example.com' },
		})

		expect(status).toBe(404)
		expect((error?.value as { type: string }).type).toBe('USER_NOT_FOUND')
	})

	it('should reject request for user with unverified email', async () => {
		const email = generateTestEmail('unverified')

		await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Unverified User',
			isEmailVerified: false,
			verificationSecret: TotpUtils.generateSecret(),
			verificationExpiresAt: addMinutes(new Date(), 5),
		})

		const { status, error } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		expect(status).toBe(400)
		expect((error?.value as { type: string }).type).toBe('EMAIL_NOT_VERIFIED')
	})

	it('should allow admin-created users without password to reset', async () => {
		const email = generateTestEmail('admin-created')

		await userRepository.create({
			email,
			password: null,
			name: 'Admin Created User',
			isEmailVerified: true,
		})

		const { data, status } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		expect(status).toBe(200)
		expect(data?.canResend).toBe(true)
	})

	it('should validate email format', async () => {
		const invalidEmails = ['invalid-email', 'test@', '@example.com']

		for (const email of invalidEmails) {
			const { status, error } = await client.auth['password-reset-status'].get({
				query: { email },
			})

			expect(status).toBe(422)
			expect(error).toBeDefined()
		}
	})

	it('should not expose sensitive data in response', async () => {
		const email = generateTestEmail('security')

		await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Security Test',
			isEmailVerified: true,
		})

		const { data } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		const responseString = JSON.stringify(data)
		expect(responseString).not.toContain('password')
		expect(responseString).not.toContain('passwordResetSecret')
		expect(responseString).not.toContain('Secret')
	})

	it('should return consistent response format', async () => {
		const email = generateTestEmail('format')

		await userRepository.create({
			email,
			password: await PasswordUtils.hash('TestPassword123!'),
			name: 'Format Test',
			isEmailVerified: true,
		})

		const { data } = await client.auth['password-reset-status'].get({
			query: { email },
		})

		expect(data).toHaveProperty('canResend')
		expect(data).toHaveProperty('remainingResendAttempts')
		expect(data).toHaveProperty('canResendAt')
		expect(data).toHaveProperty('remainingCodeAttempts')
		expect(data).toHaveProperty('canTryCodeAt')
		expect(data).toHaveProperty('isResendBlocked')
		expect(data).toHaveProperty('resendBlockedUntil')
		expect(data).toHaveProperty('codeExpiresAt')
		expect(typeof data?.canResend).toBe('boolean')
		expect(typeof data?.remainingResendAttempts).toBe('number')
	})
})
