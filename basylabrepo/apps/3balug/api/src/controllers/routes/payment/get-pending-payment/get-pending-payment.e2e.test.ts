import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'

type PendingPaymentClient = Record<
	string,
	{
		get: () => Promise<{
			data?: unknown
			status?: number
			error?: unknown
		}>
	}
>

type PendingPaymentData = {
	success?: boolean
	data?: {
		id?: string
		email?: string
		name?: string
		status?: string
		plan?: {
			id?: string
			name?: string
			price?: number
		}
		pagarmeOrderId?: string
		pagarmeChargeId?: string
		expiresAt?: unknown
	}
}

describe('GET /payment/pending-payment/:id', () => {
	const { client, planRepository, pendingPaymentRepository } = createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	it('should retrieve a pending payment successfully', async () => {
		const plans = await planRepository.findAll()
		const testPlan = plans[0]
		const email = generateTestEmail('get-pending')

		const pendingPayment = await pendingPaymentRepository.create({
			email,
			password: 'hashed-password',
			name: 'Test User',
			planId: testPlan.id,
			status: 'pending',
			expiresAt: new Date(Date.now() + 30 * 60 * 1000),
		})

		const { status, error, data } = await (
			client.payment['pending-payment'] as unknown as PendingPaymentClient
		)[pendingPayment.id].get()

		expect(status).toBe(200)
		expect(error).toBeFalsy()
		expect(data).toBeDefined()
		const typedData = data as PendingPaymentData
		expect(typedData?.success).toBe(true)
		expect(typedData?.data).toBeDefined()
		expect(typedData?.data?.id).toBe(pendingPayment.id)
		expect(typedData?.data?.email).toBe(email)
		expect(typedData?.data?.name).toBe('Test User')
		expect(typedData?.data?.status).toBe('pending')
	})

	it('should include plan details in response', async () => {
		const plans = await planRepository.findAll()
		const testPlan = plans[0]
		const email = generateTestEmail('with-plan')

		const pendingPayment = await pendingPaymentRepository.create({
			email,
			password: 'hashed-password',
			name: 'Test User',
			planId: testPlan.id,
			status: 'pending',
			expiresAt: new Date(Date.now() + 30 * 60 * 1000),
		})

		const { data, status } = await (
			client.payment['pending-payment'] as unknown as PendingPaymentClient
		)[pendingPayment.id].get()

		expect(status).toBe(200)
		const typedData = data as PendingPaymentData
		expect(typedData.data?.plan).toBeDefined()
		expect(typedData.data?.plan?.id).toBe(testPlan.id)
		expect(typedData.data?.plan?.name).toBe(testPlan.name)
		expect(typedData.data?.plan?.price).toBe(testPlan.price)
	})

	it('should return 404 for non-existent pending payment', async () => {
		const fakeId = '550e8400-e29b-41d4-a716-446655440000'

		const { status, error } = await (
			client.payment['pending-payment'] as unknown as PendingPaymentClient
		)[fakeId].get()

		expect(status).toBe(404)
		expect(error).toBeDefined()
		const typedError = error as { value?: { type?: string } }
		expect(typedError?.value?.type).toBe('PENDING_PAYMENT_NOT_FOUND')
	})

	it('should return 404 for invalid UUID format', async () => {
		const invalidId = 'not-a-uuid'

		const { status, error } = await (
			client.payment['pending-payment'] as unknown as PendingPaymentClient
		)[invalidId].get()

		expect(status).toBe(404)
		expect(error).toBeDefined()
	})

	it('should return expired pending payment with correct status', async () => {
		const plans = await planRepository.findAll()
		const testPlan = plans[0]
		const email = generateTestEmail('expired')

		const pendingPayment = await pendingPaymentRepository.create({
			email,
			password: 'hashed-password',
			name: 'Test User',
			planId: testPlan.id,
			status: 'pending',
			expiresAt: new Date(Date.now() - 1000),
		})

		const { data, status } = await (
			client.payment['pending-payment'] as unknown as PendingPaymentClient
		)[pendingPayment.id].get()

		expect(status).toBe(200)
		const typedData = data as PendingPaymentData
		expect(typedData.data?.id).toBe(pendingPayment.id)
		expect(typedData.data?.status).toBe('pending')
		const expiresAt = new Date(typedData.data?.expiresAt as string)
		expect(expiresAt.getTime()).toBeLessThan(Date.now())
	})

	it('should return paid pending payment', async () => {
		const plans = await planRepository.findAll()
		const testPlan = plans[0]
		const email = generateTestEmail('paid')

		const pendingPayment = await pendingPaymentRepository.create({
			email,
			password: 'hashed-password',
			name: 'Test User',
			planId: testPlan.id,
			status: 'paid',
			expiresAt: new Date(Date.now() + 30 * 60 * 1000),
			pagarmeOrderId: 'order_123',
			pagarmeChargeId: 'charge_123',
		})

		const { data, status } = await (
			client.payment['pending-payment'] as unknown as PendingPaymentClient
		)[pendingPayment.id].get()

		expect(status).toBe(200)
		const typedData = data as PendingPaymentData
		expect(typedData.data?.status).toBe('paid')
		expect(typedData.data?.pagarmeOrderId).toBe('order_123')
		expect(typedData.data?.pagarmeChargeId).toBe('charge_123')
	})

	it('should return failed pending payment', async () => {
		const plans = await planRepository.findAll()
		const testPlan = plans[0]
		const email = generateTestEmail('failed')

		const pendingPayment = await pendingPaymentRepository.create({
			email,
			password: 'hashed-password',
			name: 'Test User',
			planId: testPlan.id,
			status: 'failed',
			expiresAt: new Date(Date.now() + 30 * 60 * 1000),
		})

		const { data, status } = await (
			client.payment['pending-payment'] as unknown as PendingPaymentClient
		)[pendingPayment.id].get()

		expect(status).toBe(200)
		const typedData = data as PendingPaymentData
		expect(typedData.data?.status).toBe('failed')
	})

	it('should not expose password in response', async () => {
		const plans = await planRepository.findAll()
		const testPlan = plans[0]
		const email = generateTestEmail('security')

		const pendingPayment = await pendingPaymentRepository.create({
			email,
			password: 'hashed-password-secret',
			name: 'Test User',
			planId: testPlan.id,
			status: 'pending',
			expiresAt: new Date(Date.now() + 30 * 60 * 1000),
		})

		const { data } = await (client.payment['pending-payment'] as unknown as PendingPaymentClient)[
			pendingPayment.id
		].get()

		const responseString = JSON.stringify(data)
		expect(responseString).not.toContain('password')
		expect(responseString).not.toContain('hashed-password-secret')
	})

	it('should handle SQL injection attempts in ID parameter', async () => {
		const sqlInjections = [
			"'; DROP TABLE pending_payments; --",
			"' OR '1'='1",
			"1' UNION SELECT * FROM users--",
		]

		for (const injection of sqlInjections) {
			const { status } = await (
				client.payment['pending-payment'] as unknown as PendingPaymentClient
			)[injection].get()

			expect([400, 404, 422]).toContain(status ?? 0)
		}
	})

	it('should return consistent data structure for all statuses', async () => {
		const plans = await planRepository.findAll()
		const testPlan = plans[0]
		const statuses = ['pending', 'paid', 'failed', 'expired'] as const

		for (const status of statuses) {
			const pendingPayment = await pendingPaymentRepository.create({
				email: generateTestEmail(`status-${status}`),
				password: 'hashed-password',
				name: 'Test User',
				planId: testPlan.id,
				status,
				expiresAt: new Date(Date.now() + 30 * 60 * 1000),
			})

			const response = await (client.payment['pending-payment'] as unknown as PendingPaymentClient)[
				pendingPayment.id
			].get()

			const { data, status: responseStatus } = response

			expect(responseStatus).toBe(200)
			const typedData = data as PendingPaymentData
			expect(typedData?.success).toBe(true)
			expect(typedData?.data).toBeDefined()
			expect(typedData?.data?.id).toBeDefined()
			expect(typedData?.data?.email).toBeDefined()
			expect(typedData?.data?.name).toBeDefined()
			expect(typedData?.data?.status).toBe(status)
			expect(typedData?.data?.plan).toBeDefined()
			expect(typedData?.data?.expiresAt).toBeDefined()
		}
	})
})
