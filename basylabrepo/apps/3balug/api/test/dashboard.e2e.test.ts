import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CONTRACT_STATUS } from '@/db/schema/contracts'
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from '@/db/schema/properties'
import { clearTestData, createTestApp } from '@/test/setup'
import { USER_ROLES } from '@/types/roles'
import { JwtUtils } from '@/utils/jwt.utils'

const {
	client,
	userRepository,
	companyRepository,
	propertyRepository,
	propertyOwnerRepository,
	tenantRepository,
	contractRepository,
	subscriptionRepository,
	planRepository,
} = createTestApp()

describe('Dashboard E2E', () => {
	let ownerToken: string
	let managerToken: string
	let brokerToken: string
	let broker2Token: string
	let insuranceToken: string
	let companyId: string
	let ownerId: string
	let managerId: string
	let brokerId: string
	let broker2Id: string
	let insuranceId: string
	let propertyOwnerId: string
	let tenantId: string

	beforeAll(async () => {
		clearTestData()

		// Create company
		const company = await companyRepository.create({
			name: 'Test Company',
			ownerId: 'temp-owner',
		})
		companyId = company.id

		// Create owner user
		const owner = await userRepository.create({
			email: 'owner@test.com',
			password: 'hashedpassword',
			name: 'Owner User',
			role: USER_ROLES.OWNER,
			companyId,
			isActive: true,
			isEmailVerified: true,
		})
		ownerId = owner.id

		await companyRepository.update(companyId, { ownerId: owner.id })

		// Create manager user
		const manager = await userRepository.create({
			email: 'manager@test.com',
			password: 'hashedpassword',
			name: 'Manager User',
			role: USER_ROLES.MANAGER,
			companyId,
			createdBy: ownerId,
			isActive: true,
			isEmailVerified: true,
		})
		managerId = manager.id

		// Create broker user
		const broker = await userRepository.create({
			email: 'broker@test.com',
			password: 'hashedpassword',
			name: 'Broker User',
			role: USER_ROLES.BROKER,
			companyId,
			createdBy: ownerId,
			isActive: true,
			isEmailVerified: true,
		})
		brokerId = broker.id

		// Create second broker user
		const broker2 = await userRepository.create({
			email: 'broker2@test.com',
			password: 'hashedpassword',
			name: 'Broker 2 User',
			role: USER_ROLES.BROKER,
			companyId,
			createdBy: ownerId,
			isActive: true,
			isEmailVerified: true,
		})
		broker2Id = broker2.id

		// Create insurance analyst user
		const insurance = await userRepository.create({
			email: 'insurance@test.com',
			password: 'hashedpassword',
			name: 'Insurance Analyst',
			role: USER_ROLES.INSURANCE_ANALYST,
			companyId,
			createdBy: ownerId,
			isActive: true,
			isEmailVerified: true,
		})
		insuranceId = insurance.id

		// Create subscription
		const plans = await planRepository.findAll()
		await subscriptionRepository.create({
			userId: ownerId,
			planId: plans[0].id,
			status: 'active',
			startDate: new Date(),
			endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		})

		// Create property owner
		const propOwner = await propertyOwnerRepository.create({
			companyId,
			name: 'Property Owner',
			document: '12345678901',
			documentType: 'cpf',
			createdBy: ownerId,
		})
		propertyOwnerId = propOwner.id

		// Create tenant
		const tenant = await tenantRepository.create({
			companyId,
			name: 'Test Tenant',
			cpf: '98765432100',
			createdBy: ownerId,
		})
		tenantId = tenant.id

		// Generate tokens with role and companyId
		ownerToken = await JwtUtils.generateToken(ownerId, 'access', {
			role: USER_ROLES.OWNER,
			companyId,
		})
		managerToken = await JwtUtils.generateToken(managerId, 'access', {
			role: USER_ROLES.MANAGER,
			companyId,
		})
		brokerToken = await JwtUtils.generateToken(brokerId, 'access', {
			role: USER_ROLES.BROKER,
			companyId,
		})
		broker2Token = await JwtUtils.generateToken(broker2Id, 'access', {
			role: USER_ROLES.BROKER,
			companyId,
		})
		insuranceToken = await JwtUtils.generateToken(insuranceId, 'access', {
			role: USER_ROLES.INSURANCE_ANALYST,
			companyId,
		})
	})

	afterAll(() => {
		clearTestData()
	})

	beforeEach(async () => {
		propertyRepository.clear()
		contractRepository.clear()
	})

	describe('GET /api/dashboard/stats', () => {
		beforeEach(async () => {
			// Create properties with different statuses and brokers
			const property1 = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property 1 - Available',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Disponível 1, 100',
				city: 'São Paulo',
				state: 'SP',
				brokerId,
				createdBy: brokerId,
			})

			const property2 = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property 2 - Rented',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.RENTED,
				address: 'Rua Alugada 2, 200',
				city: 'Rio de Janeiro',
				state: 'RJ',
				brokerId,
				createdBy: brokerId,
			})

			const property3 = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property 3 - Available',
				type: PROPERTY_TYPES.COMMERCIAL,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Av. Comercial 3, 300',
				city: 'Belo Horizonte',
				state: 'MG',
				brokerId: broker2Id,
				createdBy: broker2Id,
			})

			const property4 = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property 4 - Maintenance',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.MAINTENANCE,
				address: 'Rua Manutenção 4, 400',
				city: 'Curitiba',
				state: 'PR',
				createdBy: ownerId,
			})

			const property5 = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property 5 - Sold',
				type: PROPERTY_TYPES.LAND,
				listingType: LISTING_TYPES.SALE,
				status: PROPERTY_STATUS.SOLD,
				address: 'Terreno Vendido 5, Lote 5',
				city: 'Porto Alegre',
				state: 'RS',
				brokerId: broker2Id,
				createdBy: broker2Id,
			})

			// Create contracts
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
			const expiringEndDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)

			// Active contract for broker 1
			await contractRepository.create({
				companyId,
				propertyId: property2.id,
				ownerId: propertyOwnerId,
				tenantId,
				brokerId,
				startDate,
				endDate,
				rentalAmount: 200000,
				paymentDay: 5,
				status: CONTRACT_STATUS.ACTIVE,
				createdBy: brokerId,
			})

			// Active contract expiring soon (no broker)
			await contractRepository.create({
				companyId,
				propertyId: property1.id,
				ownerId: propertyOwnerId,
				tenantId,
				startDate,
				endDate: expiringEndDate,
				rentalAmount: 150000,
				paymentDay: 10,
				status: CONTRACT_STATUS.ACTIVE,
				createdBy: ownerId,
			})

			// Terminated contract
			await contractRepository.create({
				companyId,
				propertyId: property3.id,
				ownerId: propertyOwnerId,
				tenantId,
				brokerId: broker2Id,
				startDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
				endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				rentalAmount: 100000,
				paymentDay: 15,
				status: CONTRACT_STATUS.TERMINATED,
				terminatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				createdBy: broker2Id,
			})
		})

		test('owner should get full company stats', async () => {
			const response = await client.api.dashboard.stats.get({
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)

			const stats = response.data?.data

			// Property stats
			expect(stats?.properties.total).toBe(5)
			expect(stats?.properties.available).toBe(2)
			expect(stats?.properties.rented).toBe(1)
			expect(stats?.properties.maintenance).toBe(1)
			expect(stats?.properties.sold).toBe(1)

			// Contract stats
			expect(stats?.contracts.total).toBe(3)
			expect(stats?.contracts.active).toBe(2)
			expect(stats?.contracts.terminated).toBe(1)
			expect(stats?.contracts.totalRentalAmount).toBe(350000) // 200000 + 150000

			// Property owners and tenants
			expect(stats?.propertyOwners.total).toBeGreaterThanOrEqual(1)
			expect(stats?.tenants.total).toBeGreaterThanOrEqual(1)

			// Expiring contracts
			expect(stats?.expiringContracts.length).toBe(1)
			expect(stats?.expiringContracts[0].rentalAmount).toBe(150000)
		})

		test('manager should get full company stats', async () => {
			const response = await client.api.dashboard.stats.get({
				headers: { Authorization: `Bearer ${managerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.properties.total).toBe(5)
			expect(response.data?.data?.contracts.total).toBe(3)
		})

		test('broker should get only their own stats', async () => {
			const response = await client.api.dashboard.stats.get({
				headers: { Authorization: `Bearer ${brokerToken}` },
			})

			expect(response.status).toBe(200)

			const stats = response.data?.data

			// Broker 1 has 2 properties assigned
			expect(stats?.properties.total).toBe(2)
			expect(stats?.properties.available).toBe(1)
			expect(stats?.properties.rented).toBe(1)

			// Broker 1 has 1 active contract
			expect(stats?.contracts.active).toBe(1)
			expect(stats?.contracts.totalRentalAmount).toBe(200000)
		})

		test('broker2 should get their own stats', async () => {
			const response = await client.api.dashboard.stats.get({
				headers: { Authorization: `Bearer ${broker2Token}` },
			})

			expect(response.status).toBe(200)

			const stats = response.data?.data

			// Broker 2 has 2 properties assigned
			expect(stats?.properties.total).toBe(2)
			expect(stats?.properties.available).toBe(1)
			expect(stats?.properties.sold).toBe(1)

			// Broker 2 has 0 active contracts (1 terminated)
			expect(stats?.contracts.active).toBe(0)
			expect(stats?.contracts.terminated).toBe(1)
		})

		test('insurance analyst should get full company stats', async () => {
			const response = await client.api.dashboard.stats.get({
				headers: { Authorization: `Bearer ${insuranceToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.properties.total).toBe(5)
			expect(response.data?.data?.contracts.total).toBe(3)
		})

		test('should fail without authentication', async () => {
			const response = await client.api.dashboard.stats.get()

			expect(response.status).toBe(401)
		})

		test('should return empty stats for new company', async () => {
			propertyRepository.clear()
			contractRepository.clear()
			propertyOwnerRepository.clear()
			tenantRepository.clear()

			const response = await client.api.dashboard.stats.get({
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)

			const stats = response.data?.data
			expect(stats?.properties.total).toBe(0)
			expect(stats?.contracts.total).toBe(0)
			expect(stats?.expiringContracts.length).toBe(0)
		})
	})
})
