import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'

describe('POST /auth/register', () => {
	const { client, planRepository, userRepository, subscriptionRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	describe('successful registration', () => {
		it('should register a new user successfully', async () => {
			const allPlans = await planRepository.findAll()
			const testPlan = allPlans[0]
			const email = generateTestEmail('register')

			// Act: Register new user with Eden Treaty client
			const { data, status, error } = await client.auth.register.post({
				email,
				password: 'SecureTest@2024!',
				name: 'Test User',
				phone: '11999999999',
				companyName: 'Test Company',
				planId: testPlan.id,
			})

			// Assert: Verify successful registration
			expect(status).toBe(201)
			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data?.success).toBe(true)
			expect(data?.data.user.email).toBe(email)
			expect(data?.data.user.name).toBe('Test User')
			expect(data?.message).toContain('Código de verificação')

			// Verify user was created in in-memory repository
			const user = await userRepository.findByEmail(email)
			expect(user).toBeDefined()
			expect(user?.isEmailVerified).toBe(false)
			expect(user?.verificationSecret).toBeDefined()
		})

		it('should create pending subscription for new user', async () => {
			const allPlans = await planRepository.findAll()
			const email = generateTestEmail('subscription')

			// Act: Register new user
			const { status } = await client.auth.register.post({
				email,
				password: 'SecureTest@2024!',
				name: 'Test User',
				phone: '11999999999',
				companyName: 'Test Company',
				planId: allPlans[0].id,
			})

			expect(status).toBe(201)

			// Assert: Verify subscription was created in repository
			const user = await userRepository.findByEmail(email)
			expect(user).toBeDefined()

			const subscription = await subscriptionRepository.findByUserId(user!.id)
			expect(subscription).toBeDefined()
			expect(subscription?.status).toBe('pending')
			expect(subscription?.planId).toBe(allPlans[0].id)
		})
	})

	describe('input validation', () => {
		it('should reject weak password', async () => {
			const allPlans = await planRepository.findAll()

			// Act: Attempt registration with weak password
			const { status, error } = await client.auth.register.post({
				email: generateTestEmail('weak-pass'),
				password: 'weak',
				name: 'Test User',
				phone: '11999999999',
				companyName: 'Test Company',
				planId: allPlans[0].id,
			})

			// Assert: Should return validation error
			expect(status).toBe(422)
			expect(error).toBeDefined()
			expect((error?.value as any).type).toBe('VALIDATION_ERROR')
		})

		it('should reject invalid plan', async () => {
			// Act: Attempt registration with non-existent plan
			const { status, error } = await client.auth.register.post({
				email: generateTestEmail('invalid-plan'),
				password: 'SecureTest@2024!',
				name: 'Test User',
				phone: '11999999999',
				companyName: 'Test Company',
				planId: 'invalid-plan-id',
			})

			// Assert: Should return not found error
			expect(status).toBe(404)
			expect((error?.value as any).type).toBe('PLAN_NOT_FOUND')
		})
	})

	describe('duplicate email handling', () => {
		it('should reject duplicate email for verified user', async () => {
			const allPlans = await planRepository.findAll()
			const email = generateTestEmail('duplicate')

			// Setup: Create verified user using repository
			await userRepository.create({
				email,
				password: 'hashed-password',
				name: 'Existing User',
				isEmailVerified: true,
				role: 'owner',
			})

			// Act: Attempt to register with same email
			const { status, error } = await client.auth.register.post({
				email,
				password: 'SecureTest@2024!',
				name: 'New User',
				phone: '11999999999',
				companyName: 'Duplicate Company',
				planId: allPlans[0].id,
			})

			// Assert: Should return conflict error
			expect(status).toBe(409)
			expect((error?.value as any).type).toBe('EMAIL_ALREADY_EXISTS')
		})
	})

	describe('security', () => {
		it('should not expose sensitive data in response', async () => {
			const allPlans = await planRepository.findAll()

			// Act: Register new user
			const { data } = await client.auth.register.post({
				email: generateTestEmail('security'),
				password: 'SecureTest@2024!',
				name: 'Test User',
				phone: '11999999999',
				companyName: 'Test Company',
				planId: allPlans[0].id,
			})

			// Assert: Verify no sensitive data in response
			const responseString = JSON.stringify(data)
			expect(responseString).not.toContain('password')
			expect(responseString).not.toContain('verificationSecret')
		})

		it('should prevent SQL injection attempts', async () => {
			const allPlans = await planRepository.findAll()
			const sqlInjections = ["test@example.com'; DROP TABLE users; --", "admin'--", "' OR '1'='1"]

			for (const injection of sqlInjections) {
				// Act: Attempt SQL injection
				const { status } = await client.auth.register.post({
					email: injection,
					password: 'SecureTest@2024!',
					name: 'Test User',
					phone: '11999999999',
					companyName: 'Test Company',
					planId: allPlans[0].id,
				})

				// Assert: Should return validation error, not crash
				expect([400, 422]).toContain(status)
			}
		})
	})
})
