import { beforeEach, describe, expect, it } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { clearTestData, createTestApp } from '@/test/setup'
import { generateTestEmail } from '@/test/test-helpers'
import { JwtUtils } from '@/utils/jwt.utils'

describe('POST /api/users - Create User E2E', () => {
	const { client, userRepository, companyRepository, planRepository, subscriptionRepository } =
		createTestApp()

	beforeEach(() => {
		clearTestData()
	})

	describe('Authentication & Authorization', () => {
		it('should return 401 when no auth token provided', async () => {
			const { status } = await client.api.users.post({
				name: 'Test User',
				email: generateTestEmail('new'),
				role: 'broker',
				password: 'SecureTest@2024!',
				phone: '11999999999',
			})

			expect(status).toBe(401)
		})

		it('should return 401 with invalid token', async () => {
			const { status } = await client.api.users.post(
				{
					name: 'Test User',
					email: generateTestEmail('new'),
					role: 'broker',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: 'Bearer invalid-token',
					},
				},
			)

			expect(status).toBe(401)
		})

		it('should return 403 when BROKER tries to create user', async () => {
			// Setup: Create company and broker user
			const plan = await planRepository.findBySlug('imobiliaria')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Test Company',
				email: generateTestEmail('company'),
			})

			const brokerUser = await userRepository.create({
				email: generateTestEmail('broker'),
				password: await PasswordUtils.hash('SecureTest@2024!'),
				name: 'Broker User',
				role: 'broker',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: brokerUser.id,
			})

			await subscriptionRepository.create({
				userId: brokerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const brokerToken = await JwtUtils.generateToken(brokerUser.id, 'access', {
				role: 'broker',
				companyId: company.id,
			})

			const { status } = await client.api.users.post(
				{
					name: 'New User',
					email: generateTestEmail('attempt'),
					role: 'broker',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${brokerToken}`,
					},
				},
			)

			expect(status).toBe(403)
		})

		it('should return 403 when MANAGER tries to create user', async () => {
			const plan = await planRepository.findBySlug('house')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Manager Company',
				email: generateTestEmail('manager-company'),
			})

			const ownerUser = await userRepository.create({
				email: generateTestEmail('owner-for-manager'),
				password: 'hashed-password',
				name: 'Owner User',
				role: 'owner',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: ownerUser.id,
			})

			await subscriptionRepository.create({
				userId: ownerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const managerUser = await userRepository.create({
				email: generateTestEmail('manager'),
				password: await PasswordUtils.hash('SecureTest@2024!'),
				name: 'Manager User',
				role: 'manager',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const managerToken = await JwtUtils.generateToken(managerUser.id, 'access', {
				role: 'manager',
				password: 'SecureTest@2024!',
				companyId: company.id,
			})

			const { status } = await client.api.users.post(
				{
					name: 'New User',
					email: generateTestEmail('manager-attempt'),
					role: 'broker',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${managerToken}`,
					},
				},
			)

			expect(status).toBe(403)
		})
	})

	describe('Plan Limits Validation', () => {
		it('should return 400 when exceeding maxUsers limit', async () => {
			// Get Básico plan (maxUsers = 1)
			const plan = await planRepository.findBySlug('basico')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Basic Plan Company',
				email: generateTestEmail('basic-company'),
			})

			const ownerUser = await userRepository.create({
				email: generateTestEmail('basic-owner'),
				password: 'hashed-password',
				name: 'Basic Owner',
				role: 'owner',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: ownerUser.id,
			})

			await subscriptionRepository.create({
				userId: ownerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			// Create first user (should work - within limit)
			await userRepository.create({
				email: generateTestEmail('first-broker'),
				password: await PasswordUtils.hash('SecureTest@2024!'),
				name: 'First Broker',
				role: 'broker',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const ownerToken = await JwtUtils.generateToken(ownerUser.id, 'access', {
				role: 'owner',
				companyId: company.id,
			})

			// Try to create second user (should fail - exceeds limit)
			const { status } = await client.api.users.post(
				{
					name: 'Second Broker',
					email: generateTestEmail('second-broker'),
					role: 'broker',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				},
			)

			expect(status).toBe(403)
		})

		it('should return 403 when exceeding maxManagers limit', async () => {
			// Get Imobiliária plan (maxManagers = 0)
			const plan = await planRepository.findBySlug('imobiliaria')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Imob Company',
				email: generateTestEmail('imob-company'),
			})

			const ownerUser = await userRepository.create({
				email: generateTestEmail('imob-owner'),
				password: 'hashed-password',
				name: 'Imob Owner',
				role: 'owner',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: ownerUser.id,
			})

			await subscriptionRepository.create({
				userId: ownerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const ownerToken = await JwtUtils.generateToken(ownerUser.id, 'access', {
				role: 'owner',
				companyId: company.id,
			})

			// Try to create manager (should fail - plan doesn't allow managers)
			const { status } = await client.api.users.post(
				{
					name: 'Manager User',
					email: generateTestEmail('manager-attempt'),
					role: 'manager',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				},
			)

			expect(status).toBe(403)
		})
	})

	describe('Input Validation', () => {
		it('should return 422 for invalid email format', async () => {
			const plan = await planRepository.findBySlug('imobiliaria')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Validation Company',
				email: generateTestEmail('validation-company'),
			})

			const ownerUser = await userRepository.create({
				email: generateTestEmail('validation-owner'),
				password: 'hashed-password',
				name: 'Validation Owner',
				role: 'owner',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: ownerUser.id,
			})

			await subscriptionRepository.create({
				userId: ownerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const ownerToken = await JwtUtils.generateToken(ownerUser.id, 'access', {
				role: 'owner',
				companyId: company.id,
			})

			const { status } = await client.api.users.post(
				{
					name: 'Test User',
					email: 'invalid-email',
					role: 'broker',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 422 for invalid role', async () => {
			const plan = await planRepository.findBySlug('imobiliaria')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Role Company',
				email: generateTestEmail('role-company'),
			})

			const ownerUser = await userRepository.create({
				email: generateTestEmail('role-owner'),
				password: 'hashed-password',
				name: 'Role Owner',
				role: 'owner',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: ownerUser.id,
			})

			await subscriptionRepository.create({
				userId: ownerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const ownerToken = await JwtUtils.generateToken(ownerUser.id, 'access', {
				role: 'owner',
				companyId: company.id,
			})

			const { status } = await client.api.users.post(
				{
					name: 'Test User',
					email: generateTestEmail('invalid-role'),
					role: 'invalid_role' as any,
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				},
			)

			expect(status).toBe(422)
		})

		it('should return 409 when email already exists', async () => {
			const plan = await planRepository.findBySlug('imobiliaria')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Duplicate Company',
				email: generateTestEmail('dup-company'),
			})

			const ownerUser = await userRepository.create({
				email: generateTestEmail('dup-owner'),
				password: 'hashed-password',
				name: 'Dup Owner',
				role: 'owner',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: ownerUser.id,
			})

			await subscriptionRepository.create({
				userId: ownerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const existingEmail = generateTestEmail('existing')
			await userRepository.create({
				email: existingEmail,
				password: await PasswordUtils.hash('SecureTest@2024!'),
				name: 'Existing User',
				role: 'broker',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			const ownerToken = await JwtUtils.generateToken(ownerUser.id, 'access', {
				role: 'owner',
				companyId: company.id,
			})

			const { status } = await client.api.users.post(
				{
					name: 'Duplicate User',
					email: existingEmail,
					role: 'broker',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				},
			)

			expect(status).toBe(409)
		})
	})

	describe('Successful User Creation', () => {
		it('should create user successfully when OWNER and within limits', async () => {
			const plan = await planRepository.findBySlug('imobiliaria')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'Success Company',
				email: generateTestEmail('success-company'),
			})

			const ownerUser = await userRepository.create({
				email: generateTestEmail('success-owner'),
				password: 'hashed-password',
				name: 'Success Owner',
				role: 'owner',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: ownerUser.id,
			})

			await subscriptionRepository.create({
				userId: ownerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const ownerToken = await JwtUtils.generateToken(ownerUser.id, 'access', {
				role: 'owner',
				companyId: company.id,
			})

			const newUserEmail = generateTestEmail('new-broker')
			const { status, data } = await client.api.users.post(
				{
					name: 'New Broker',
					email: newUserEmail,
					role: 'broker',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data).toBeDefined()
			expect(data?.data.email).toBe(newUserEmail)
			expect(data?.data.role).toBe('broker')
			expect(data?.data.companyId).toBe(company.id)
			expect(data?.data.isActive).toBe(true)
		})

		it('should create manager when OWNER and House plan', async () => {
			const plan = await planRepository.findBySlug('house')
			if (!plan) throw new Error('Plan not found')

			const company = await companyRepository.create({
				name: 'House Company',
				email: generateTestEmail('house-company'),
			})

			const ownerUser = await userRepository.create({
				email: generateTestEmail('house-owner'),
				password: 'hashed-password',
				name: 'House Owner',
				role: 'owner',
				companyId: company.id,
				isActive: true,
				isEmailVerified: true,
			})

			await companyRepository.update(company.id, {
				ownerId: ownerUser.id,
			})

			await subscriptionRepository.create({
				userId: ownerUser.id,
				planId: plan.id,
				status: 'active',
				startDate: new Date(),
			})

			const ownerToken = await JwtUtils.generateToken(ownerUser.id, 'access', {
				role: 'owner',
				companyId: company.id,
			})

			const managerEmail = generateTestEmail('new-manager')
			const { status, data } = await client.api.users.post(
				{
					name: 'New Manager',
					email: managerEmail,
					role: 'manager',
					password: 'SecureTest@2024!',
					phone: '11999999999',
				},
				{
					headers: {
						Authorization: `Bearer ${ownerToken}`,
					},
				},
			)

			expect(status).toBe(200)
			expect(data?.data.role).toBe('manager')
		})
	})
})
