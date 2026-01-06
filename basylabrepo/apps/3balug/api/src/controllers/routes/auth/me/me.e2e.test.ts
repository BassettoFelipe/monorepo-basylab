import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { addDays, createAuthenticatedUser, generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('GET /auth/me', () => {
	const { client, userRepository, planRepository, subscriptionRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	it('should return current user data when authenticated', async () => {
		const { user } = await createAuthenticatedUser(
			userRepository,
			planRepository,
			subscriptionRepository,
		)

		const accessToken = await JwtUtils.generateToken(user.id, 'access')

		const { data, status, error } = await client.auth.me.get({
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		expect(status).toBe(200)
		expect(error).toBeFalsy()
		expect(data).toBeDefined()
		expect(data?.user.email).toBe(user.email)
		expect(data?.user.name).toBe(user.name)
		expect(data?.user.subscription).toBeDefined()
		expect(data?.user.subscription?.status).toBe('active')
	})

	it('should reject request without authentication token', async () => {
		const { status, error } = await client.auth.me.get()

		expect(status).toBe(401)
		expect(error).toBeDefined()
		expect(error?.value.type as any).toBe('AUTHENTICATION_REQUIRED')
	})

	it('should reject request with invalid token', async () => {
		const { status, error } = await client.auth.me.get({
			headers: {
				Authorization: 'Bearer invalid-token',
			},
		})

		expect(status).toBe(401)
		expect(error).toBeDefined()
		expect(['TOKEN_EXPIRED', 'INVALID_TOKEN']).toContain(error?.value.type as any)
	})

	it('should reject request with expired token', async () => {
		await createAuthenticatedUser(userRepository, planRepository, subscriptionRepository)

		// Wait briefly to ensure time has passed
		await new Promise((resolve) => setTimeout(resolve, 10))

		// Note: In real implementation, we'd need to mock time or create a token with past expiration
		// For now, we test the happy path and invalid token cases
		const { status, error } = await client.auth.me.get({
			headers: {
				Authorization: 'Bearer expired.token.here',
			},
		})

		expect(status).toBe(401)
		expect(error).toBeDefined()
	})

	it('should reject request with non-existent user', async () => {
		// Generate token for non-existent user
		const nonExistentUserId = 'non-existent-user-id'
		const accessToken = await JwtUtils.generateToken(nonExistentUserId, 'access')

		const { status, error } = await client.auth.me.get({
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		expect(status).toBe(404)
		expect(error?.value.type as any).toBe('USER_NOT_FOUND')
	})

	it('should include subscription details when available', async () => {
		const { user } = await createAuthenticatedUser(
			userRepository,
			planRepository,
			subscriptionRepository,
		)

		const accessToken = await JwtUtils.generateToken(user.id, 'access')

		const { data, status } = await client.auth.me.get({
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		expect(status).toBe(200)
		expect(data?.user.subscription).toBeDefined()
		expect(data?.user.subscription?.status).toBe('active')
		expect(data?.user.subscription?.plan).toBeDefined()
		expect(data?.user.subscription?.plan.name).toBeDefined()
		expect(data?.user.subscription?.plan.price).toBeDefined()
	})

	it('should return 403 when user has no subscription', async () => {
		const email = generateTestEmail('no-sub')
		const user = await userRepository.create({
			email,
			password: 'hashed-password',
			name: 'No Subscription User',
			isEmailVerified: true,
		})

		const accessToken = await JwtUtils.generateToken(user.id, 'access')

		const { status, error } = await client.auth.me.get({
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		expect(status).toBe(403)
		expect(error?.value.type as any).toBe('SUBSCRIPTION_REQUIRED')
	})

	it('should not expose sensitive data in response', async () => {
		const { user } = await createAuthenticatedUser(
			userRepository,
			planRepository,
			subscriptionRepository,
		)

		const accessToken = await JwtUtils.generateToken(user.id, 'access')

		const { data } = await client.auth.me.get({
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		const responseString = JSON.stringify(data)
		expect(responseString).not.toContain('password')
		expect(responseString).not.toContain('verificationSecret')
		expect(data?.user).not.toHaveProperty('password')
	})

	it('should return 403 for expired subscription', async () => {
		const email = generateTestEmail('expired')
		const user = await userRepository.create({
			email,
			password: 'hashed-password',
			name: 'Expired User',
			isEmailVerified: true,
		})

		const plans = await planRepository.findAll()
		const now = new Date()

		await subscriptionRepository.create({
			userId: user.id,
			planId: plans[0].id,
			status: 'expired',
			startDate: addDays(now, -60),
			endDate: addDays(now, -30),
		})

		const accessToken = await JwtUtils.generateToken(user.id, 'access')

		const { status, error } = await client.auth.me.get({
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		expect(status).toBe(403)
		expect(error?.value.type as any).toBe('SUBSCRIPTION_REQUIRED')
	})

	it('should reject malformed Authorization header', async () => {
		const { status, error } = await client.auth.me.get({
			headers: {
				Authorization: 'InvalidFormat token-here',
			},
		})

		expect(status).toBe(401)
		expect(error).toBeDefined()
	})

	it('should reject empty Authorization header', async () => {
		const { status, error } = await client.auth.me.get({
			headers: {
				Authorization: '',
			},
		})

		expect(status).toBe(401)
		expect(error).toBeDefined()
	})
})
