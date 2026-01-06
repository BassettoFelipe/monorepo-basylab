import { beforeEach, describe, expect, it } from 'bun:test'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('DELETE /api/users/:id - Deactivate User E2E', () => {
	const { client, userRepository, companyRepository, planRepository, subscriptionRepository } =
		createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	it('should return 401 when no auth token provided', async () => {
		const { status } = await client.api.users({ id: 'fake-id' }).delete()

		expect(status).toBe(401)
	})

	it('should return 403 when BROKER tries to deactivate user', async () => {
		const plan = await planRepository.findBySlug('imobiliaria')
		if (!plan) throw new Error('Plan not found')

		const company = await companyRepository.create({
			name: 'Deactivate Test Company',
			email: generateTestEmail('deactivate-company'),
		})

		const owner = await userRepository.create({
			email: generateTestEmail('deactivate-owner'),
			password: 'hashed',
			name: 'Owner',
			role: 'owner',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		await companyRepository.update(company.id, { ownerId: owner.id })

		const broker = await userRepository.create({
			email: generateTestEmail('deactivate-broker'),
			password: 'hashed',
			name: 'Broker',
			role: 'broker',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		const brokerToken = await JwtUtils.generateToken(broker.id, 'access', {
			role: 'broker',
			companyId: company.id,
		})

		const { status } = await client.api.users({ id: broker.id }).delete(undefined, {
			headers: { Authorization: `Bearer ${brokerToken}` },
		})

		expect(status).toBe(403)
	})

	it('should prevent deactivating owner account', async () => {
		const plan = await planRepository.findBySlug('imobiliaria')
		if (!plan) throw new Error('Plan not found')

		const company = await companyRepository.create({
			name: 'Owner Deactivate Company',
			email: generateTestEmail('owner-deactivate-company'),
		})

		const owner = await userRepository.create({
			email: generateTestEmail('owner-no-deactivate'),
			password: 'hashed',
			name: 'Owner',
			role: 'owner',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		await companyRepository.update(company.id, { ownerId: owner.id })

		await subscriptionRepository.create({
			userId: owner.id,
			planId: plan.id,
			status: 'active',
			startDate: new Date(),
		})

		const token = await JwtUtils.generateToken(owner.id, 'access', {
			role: 'owner',
			companyId: company.id,
		})

		const { status } = await client.api
			.users({ id: owner.id })
			.delete(undefined, { headers: { Authorization: `Bearer ${token}` } })

		expect(status).toBe(403)
	})

	it('should deactivate user successfully when OWNER', async () => {
		const plan = await planRepository.findBySlug('imobiliaria')
		if (!plan) throw new Error('Plan not found')

		const company = await companyRepository.create({
			name: 'Success Deactivate Company',
			email: generateTestEmail('success-deactivate-company'),
		})

		const owner = await userRepository.create({
			email: generateTestEmail('success-deactivate-owner'),
			password: 'hashed',
			name: 'Owner',
			role: 'owner',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		await companyRepository.update(company.id, { ownerId: owner.id })

		await subscriptionRepository.create({
			userId: owner.id,
			planId: plan.id,
			status: 'active',
			startDate: new Date(),
		})

		const broker = await userRepository.create({
			email: generateTestEmail('broker-to-deactivate'),
			password: 'hashed',
			name: 'Broker',
			role: 'broker',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		const token = await JwtUtils.generateToken(owner.id, 'access', {
			role: 'owner',
			companyId: company.id,
		})

		const { status, data } = await client.api
			.users({ id: broker.id })
			.delete(undefined, { headers: { Authorization: `Bearer ${token}` } })

		expect(status).toBe(200)
		expect(data?.data.isActive).toBe(false)
	})

	it('should prevent deactivating already inactive user', async () => {
		const plan = await planRepository.findBySlug('imobiliaria')
		if (!plan) throw new Error('Plan not found')

		const company = await companyRepository.create({
			name: 'Already Inactive Company',
			email: generateTestEmail('already-inactive-company'),
		})

		const owner = await userRepository.create({
			email: generateTestEmail('already-inactive-owner'),
			password: 'hashed',
			name: 'Owner',
			role: 'owner',
			companyId: company.id,
			isActive: true,
			isEmailVerified: true,
		})

		await companyRepository.update(company.id, { ownerId: owner.id })

		await subscriptionRepository.create({
			userId: owner.id,
			planId: plan.id,
			status: 'active',
			startDate: new Date(),
		})

		const broker = await userRepository.create({
			email: generateTestEmail('already-inactive-broker'),
			password: 'hashed',
			name: 'Broker',
			role: 'broker',
			companyId: company.id,
			isActive: false,
			isEmailVerified: true,
		})

		const token = await JwtUtils.generateToken(owner.id, 'access', {
			role: 'owner',
			companyId: company.id,
		})

		const { status } = await client.api
			.users({ id: broker.id })
			.delete(undefined, { headers: { Authorization: `Bearer ${token}` } })

		expect(status).toBe(400)
	})

	it('should enforce company isolation - cannot deactivate user from different company', async () => {
		const plan = await planRepository.findBySlug('imobiliaria')
		if (!plan) throw new Error('Plan not found')

		// Company A
		const companyA = await companyRepository.create({
			name: 'Company A',
			email: generateTestEmail('deactivate-isolation-company-a'),
		})

		const ownerA = await userRepository.create({
			email: generateTestEmail('deactivate-isolation-owner-a'),
			password: 'hashed',
			name: 'Owner A',
			role: 'owner',
			companyId: companyA.id,
			isActive: true,
			isEmailVerified: true,
		})

		await companyRepository.update(companyA.id, { ownerId: ownerA.id })

		await subscriptionRepository.create({
			userId: ownerA.id,
			planId: plan.id,
			status: 'active',
			startDate: new Date(),
		})

		// Company B
		const companyB = await companyRepository.create({
			name: 'Company B',
			email: generateTestEmail('deactivate-isolation-company-b'),
		})

		const ownerB = await userRepository.create({
			email: generateTestEmail('deactivate-isolation-owner-b'),
			password: 'hashed',
			name: 'Owner B',
			role: 'owner',
			companyId: companyB.id,
			isActive: true,
			isEmailVerified: true,
		})

		await companyRepository.update(companyB.id, { ownerId: ownerB.id })

		const brokerB = await userRepository.create({
			email: generateTestEmail('deactivate-isolation-broker-b'),
			password: 'hashed',
			name: 'Broker B',
			role: 'broker',
			companyId: companyB.id,
			isActive: true,
			isEmailVerified: true,
		})

		const tokenA = await JwtUtils.generateToken(ownerA.id, 'access', {
			role: 'owner',
			companyId: companyA.id,
		})

		// Owner A tries to deactivate Broker B (different company)
		const { status } = await client.api
			.users({ id: brokerB.id })
			.delete(undefined, { headers: { Authorization: `Bearer ${tokenA}` } })

		expect(status).toBe(403)
	})
})
