import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'

const { client, userRepository, planRepository } = createTestApp()

let capturedVerificationCode: string | null = null

const mockSendVerificationCode = mock((to: string, name: string, code: string) => {
	capturedVerificationCode = code
	return Promise.resolve()
})

mock.module('@/services/email/email.service', () => ({
	emailService: {
		sendVerificationCode: mockSendVerificationCode,
		verifyConnection: mock(() => Promise.resolve(true)),
	},
	EmailServiceError: class EmailServiceError extends Error {
		constructor(
			message: string,
			public readonly originalError?: unknown,
		) {
			super(message)
			this.name = 'EmailServiceError'
		}
	},
}))

describe('Auth Registration Flow E2E', () => {
	let planId: string
	const testEmail = `e2e-test-${Date.now()}@example.com`

	beforeAll(async () => {
		clearTestData()
		const plans = await planRepository.findAll()
		planId = plans[0]?.id || 'plan-basico'
	})

	afterAll(async () => {
		await userRepository.deleteByEmail(testEmail)
		await userRepository.deleteByEmail(`resend-${testEmail}`)
		await userRepository.deleteByEmail(`multiple-${testEmail}`)
		clearTestData()
	})

	test('should complete full registration flow: register -> resend -> confirm', async () => {
		// NOTE: This is a multi-step integration test that validates the complete
		// user registration workflow. It follows an "Act-Assert-Act-Assert" pattern
		// instead of pure AAA because it tests sequential API interactions.

		// PHASE 1: User Registration
		// Arrange: Clear mocks and prepare for registration
		mockSendVerificationCode.mockClear()
		capturedVerificationCode = null

		// Act: Register new user
		const registerResponse = await client.auth.register.post({
			email: testEmail,
			password: 'SecureP@ss123',
			name: 'E2E Test User',
			companyName: 'E2E Test Company',
			planId,
		})

		// Assert: Registration successful and code sent
		expect(registerResponse.status).toBe(201)
		expect(registerResponse.data).toBeDefined()
		expect(mockSendVerificationCode).toHaveBeenCalledTimes(1)
		expect(capturedVerificationCode).toMatch(/^\d{6}$/)

		const firstCode = capturedVerificationCode

		// PHASE 2: Check Resend Status
		// Act: Get resend status
		const statusResponse = await client.auth['resend-status'].post({
			email: testEmail,
		})

		// Assert: Status shows available resend attempts
		expect(statusResponse.status).toBe(200)
		if (statusResponse.data) {
			expect(statusResponse.data.remainingAttempts).toBe(5)
			expect(statusResponse.data.canResend).toBe(true)
		}

		// PHASE 3: Resend Verification Code
		// Arrange: Clear previous code and wait to avoid rate limiting
		mockSendVerificationCode.mockClear()
		capturedVerificationCode = null
		await new Promise((resolve) => setTimeout(resolve, 50))

		// Act: Request code resend
		const resendResponse = await client.auth['resend-verification-code'].post({
			email: testEmail,
		})

		// Assert: New code sent and different from first
		expect(resendResponse.status).toBe(200)
		expect(resendResponse.data).toBeDefined()
		expect(mockSendVerificationCode).toHaveBeenCalledTimes(1)
		expect(capturedVerificationCode).toMatch(/^\d{6}$/)
		expect(capturedVerificationCode).not.toBe(firstCode)

		if (resendResponse.data) {
			expect(resendResponse.data.remainingAttempts).toBe(4)
		}

		// PHASE 4: Confirm Email
		// Act: Confirm email with new verification code
		const confirmResponse = await client.auth['confirm-email'].post({
			email: testEmail,
			code: capturedVerificationCode!,
		})

		// Assert: Email confirmed and checkout token provided
		expect(confirmResponse.status).toBe(200)
		expect(confirmResponse.data).toBeDefined()
		if (confirmResponse.data) {
			expect(confirmResponse.data.checkoutToken).toBeDefined()
			expect(confirmResponse.data.checkoutExpiresAt).toBeDefined()
			// checkoutExpiresAt can be either a string or Date object depending on serialization
			const expiresAt =
				confirmResponse.data.checkoutExpiresAt instanceof Date
					? confirmResponse.data.checkoutExpiresAt
					: new Date(confirmResponse.data.checkoutExpiresAt)
			expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
		}

		// Final Assert: User marked as verified in repository
		const user = await userRepository.findByEmail(testEmail)
		expect(user).toBeDefined()
		expect(user?.isEmailVerified).toBe(true)
	})

	test('should prevent confirmation with wrong code', async () => {
		const email = `wrong-code-${testEmail}`

		await client.auth.register.post({
			email,
			password: 'SecureP@ss123',
			name: 'Wrong Code Test',
			companyName: 'Wrong Code Test Company',
			planId,
		})

		const confirmResponse = await client.auth['confirm-email'].post({
			email,
			code: '000000',
		})

		expect(confirmResponse.status).toBe(400)
		expect(confirmResponse.error?.value).toHaveProperty('type', 'INVALID_VERIFICATION_CODE')

		await userRepository.deleteByEmail(email)
	})

	test('should prevent confirmation with expired code', async () => {
		const email = `expired-${testEmail}`

		await client.auth.register.post({
			email,
			password: 'SecureP@ss123',
			name: 'Expired Code Test',
			companyName: 'Expired Code Test Company',
			planId,
		})

		const user = await userRepository.findByEmail(email)
		if (user) {
			await userRepository.update(user.id, {
				verificationExpiresAt: new Date(Date.now() - 1000),
			})
		}

		const confirmResponse = await client.auth['confirm-email'].post({
			email,
			code: capturedVerificationCode ?? '000000',
		})

		expect(confirmResponse.status).toBe(400)
		expect(confirmResponse.error?.value).toHaveProperty('type', 'VERIFICATION_CODE_EXPIRED')

		await userRepository.deleteByEmail(email)
	})

	test('should enforce max resend attempts', async () => {
		const email = `max-resend-${testEmail}`
		mockSendVerificationCode.mockClear()

		await client.auth.register.post({
			email,
			password: 'SecureP@ss123',
			name: 'Max Resend Test',
			companyName: 'Max Resend Test Company',
			planId,
		})

		const user = await userRepository.findByEmail(email)
		if (user) {
			await userRepository.update(user.id, {
				verificationResendCount: 5,
				verificationLastResendAt: new Date(Date.now() - 1000),
			})
		}

		const resendResponse = await client.auth['resend-verification-code'].post({
			email,
		})

		expect(resendResponse.status).toBe(429)
		expect(resendResponse.error?.value).toHaveProperty('type', 'RESEND_LIMIT_EXCEEDED')

		await userRepository.deleteByEmail(email)
	})
})
