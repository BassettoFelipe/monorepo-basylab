import { afterAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import * as emailServiceModule from '@/services/email'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'

// Mock do email service
const mockSendVerificationCode = mock(() => Promise.resolve())

const mockEmailService = {
	sendVerificationCode: mockSendVerificationCode,
	verifyConnection: mock(() => Promise.resolve(true)),
}

const mockGetEmailServiceInstance = spyOn(
	emailServiceModule,
	'getEmailServiceInstance',
).mockReturnValue(mockEmailService as any)

describe('POST /payment/create-pending-payment', () => {
	const { client, userRepository, planRepository, pendingPaymentRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
		mockSendVerificationCode.mockClear()
	})

	afterAll(() => {
		mockGetEmailServiceInstance.mockRestore()
	})

	it('should create a pending payment successfully', async () => {
		const plans = await planRepository.findAll()
		const testPlan = plans[0]
		const email = generateTestEmail('pending-payment')

		const { data, status, error } = await client.payment['create-pending-payment'].post({
			email,
			password: 'SecureTest@2024!',
			name: 'Test User',
			planId: testPlan.id,
		})

		expect(status).toBe(201)
		expect(error).toBeFalsy()
		expect(data).toBeDefined()
		expect(data?.success).toBe(true)
		expect(data?.message).toBe('Pending payment created successfully')
		expect(data?.data.pendingPaymentId).toBeDefined()
		expect(data?.data.expiresAt).toBeDefined()

		// Verify pending payment was created in database
		expect(data?.data.pendingPaymentId).toBeDefined()
		const pendingPayment = await pendingPaymentRepository.findById(data!.data.pendingPaymentId)
		expect(pendingPayment).toBeDefined()
		expect(pendingPayment?.email).toBe(email)
		expect(pendingPayment?.status).toBe('pending')
		expect(pendingPayment?.planId).toBe(testPlan.id)
	})

	it('should reject weak password', async () => {
		const plans = await planRepository.findAll()

		const { status, error } = await client.payment['create-pending-payment'].post({
			email: generateTestEmail('weak-pass'),
			password: 'weak',
			name: 'Test User',
			planId: plans[0].id,
		})

		expect(status).toBe(422)
		expect(error).toBeDefined()
	})

	it('should reject password without uppercase letter', async () => {
		const plans = await planRepository.findAll()

		const { status, error } = await client.payment['create-pending-payment'].post({
			email: generateTestEmail('no-upper'),
			password: 'test@1234',
			name: 'Test User',
			planId: plans[0].id,
		})

		expect(status).toBe(422)
		expect(error).toBeDefined()
	})

	it('should reject password without special character', async () => {
		const plans = await planRepository.findAll()

		const { status, error } = await client.payment['create-pending-payment'].post({
			email: generateTestEmail('no-special'),
			password: 'TestPassword123',
			name: 'Test User',
			planId: plans[0].id,
		})

		expect(status).toBe(422)
		expect(error).toBeDefined()
	})

	it('should reject invalid email format', async () => {
		const plans = await planRepository.findAll()

		const { status, error } = await client.payment['create-pending-payment'].post({
			email: 'invalid-email',
			password: 'SecureTest@2024!',
			name: 'Test User',
			planId: plans[0].id,
		})

		expect(status).toBe(422)
		expect(error).toBeDefined()
	})

	it('should reject name that is too short', async () => {
		const plans = await planRepository.findAll()

		const { status, error } = await client.payment['create-pending-payment'].post({
			email: generateTestEmail('short-name'),
			password: 'SecureTest@2024!',
			name: 'A',
			planId: plans[0].id,
		})

		expect(status).toBe(422)
		expect(error).toBeDefined()
	})

	it('should reject invalid plan ID', async () => {
		const { status, error } = await client.payment['create-pending-payment'].post({
			email: generateTestEmail('invalid-plan'),
			password: 'SecureTest@2024!',
			name: 'Test User',
			planId: 'invalid-plan-id',
		})

		expect(status).toBe(404)
		expect(error?.value.type as any).toBe('PLAN_NOT_FOUND')
	})

	it('should reject if user already exists with verified email', async () => {
		const plans = await planRepository.findAll()
		const email = generateTestEmail('existing-verified')

		// Create verified user
		await userRepository.create({
			email,
			password: 'hashed',
			name: 'Existing User',
			isEmailVerified: true,
		})

		const { status, error } = await client.payment['create-pending-payment'].post({
			email,
			password: 'SecureTest@2024!',
			name: 'Test User',
			planId: plans[0].id,
		})

		expect(status).toBe(409)
		expect(error?.value.type as any).toBe('EMAIL_ALREADY_EXISTS')
	})

	it('should allow creating pending payment if previous user is unverified', async () => {
		const plans = await planRepository.findAll()
		const email = generateTestEmail('existing-unverified')

		// Create unverified user
		await userRepository.create({
			email,
			password: 'hashed',
			name: 'Old User',
			isEmailVerified: false,
			verificationSecret: 'old-secret',
			verificationExpiresAt: new Date(Date.now() - 1000),
		})

		const { data, status, error } = await client.payment['create-pending-payment'].post({
			email,
			password: 'SecureTest@2024!',
			name: 'Test User',
			planId: plans[0].id,
		})

		expect(status).toBe(201)
		expect(error).toBeFalsy()
		expect(data?.data.pendingPaymentId).toBeDefined()
	})

	it('should set expiration time correctly', async () => {
		const plans = await planRepository.findAll()
		const beforeCreate = Date.now()

		const { data, status } = await client.payment['create-pending-payment'].post({
			email: generateTestEmail('expiration'),
			password: 'SecureTest@2024!',
			name: 'Test User',
			planId: plans[0].id,
		})

		expect(status).toBe(201)

		expect(data?.data.pendingPaymentId).toBeDefined()
		const pendingPayment = await pendingPaymentRepository.findById(data!.data.pendingPaymentId)

		expect(pendingPayment).toBeDefined()
		expect(pendingPayment?.expiresAt).toBeDefined()

		// Should expire in approximately 30 minutes (allow 1 minute tolerance)
		const expiresAt = new Date(pendingPayment?.expiresAt ?? Date.now()).getTime()
		const expectedExpiration = beforeCreate + 30 * 60 * 1000 // 30 minutes
		const tolerance = 60 * 1000 // 1 minute

		expect(Math.abs(expiresAt - expectedExpiration)).toBeLessThan(tolerance)
	})

	it('should not expose sensitive data in response', async () => {
		const plans = await planRepository.findAll()

		const { data } = await client.payment['create-pending-payment'].post({
			email: generateTestEmail('security'),
			password: 'SecureTest@2024!',
			name: 'Test User',
			planId: plans[0].id,
		})

		const responseString = JSON.stringify(data)
		expect(responseString).not.toContain('password')
		expect(responseString).not.toContain('SecureTest@2024!')
	})

	it('should handle SQL injection attempts', async () => {
		const plans = await planRepository.findAll()
		const sqlInjections = [
			"test@example.com'; DROP TABLE pending_payments; --",
			"admin'--",
			"' OR '1'='1",
		]

		for (const injection of sqlInjections) {
			const { status } = await client.payment['create-pending-payment'].post({
				email: injection,
				password: 'SecureTest@2024!',
				name: 'Test User',
				planId: plans[0].id,
			})

			// Should be validation error, not crash
			expect([400, 422]).toContain(status)
		}
	})

	it('should store password in hashed format', async () => {
		const plans = await planRepository.findAll()
		const plainPassword = 'SecureTest@2024!'

		const { data, status } = await client.payment['create-pending-payment'].post({
			email: generateTestEmail('hashed-password'),
			password: plainPassword,
			name: 'Test User',
			planId: plans[0].id,
		})

		expect(status).toBe(201)

		expect(data?.data.pendingPaymentId).toBeDefined()
		const pendingPayment = await pendingPaymentRepository.findById(data!.data.pendingPaymentId)

		expect(pendingPayment).toBeDefined()
		expect(pendingPayment?.password).toBeDefined()
		expect(pendingPayment?.password).not.toBe(plainPassword)
		// Bcrypt hashes start with $2a$, $2b$, or $2y$
		expect(pendingPayment?.password).toMatch(/^\$2[aby]\$/)
	})
})
