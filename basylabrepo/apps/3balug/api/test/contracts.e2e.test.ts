import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CONTRACT_STATUS } from '@/db/schema/contracts'
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from '@/db/schema/properties'
import { clearTestData, createAuthenticatedClient, createTestApp } from '@/test/setup'
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

describe('Contracts E2E', () => {
	let ownerToken: string
	let managerToken: string
	let brokerToken: string
	let companyId: string
	let ownerId: string
	let managerId: string
	let brokerId: string
	let propertyOwnerId: string
	let tenantId: string
	let propertyId: string

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
			isActive: true,
			isEmailVerified: true,
		})
		brokerId = broker.id

		// Create subscriptions for all users
		const plans = await planRepository.findAll()
		const subscriptionData = {
			planId: plans[0].id,
			status: 'active' as const,
			startDate: new Date(),
			endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		}

		await subscriptionRepository.create({
			userId: ownerId,
			...subscriptionData,
		})

		await subscriptionRepository.create({
			userId: managerId,
			...subscriptionData,
		})

		await subscriptionRepository.create({
			userId: brokerId,
			...subscriptionData,
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
	})

	afterAll(() => {
		clearTestData()
	})

	beforeEach(async () => {
		contractRepository.clear()
		propertyRepository.clear()

		// Create a fresh property for each test
		const property = await propertyRepository.create({
			companyId,
			ownerId: propertyOwnerId,
			title: 'Test Property',
			type: PROPERTY_TYPES.APARTMENT,
			listingType: LISTING_TYPES.RENT,
			status: PROPERTY_STATUS.AVAILABLE,
			address: 'Rua Teste, 123',
			city: 'São Paulo',
			state: 'SP',
			rentalPrice: 200000,
			brokerId,
			createdBy: ownerId,
		})
		propertyId = property.id
	})

	describe('POST /api/contracts', () => {
		test('owner should create a contract successfully', async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const authClient = createAuthenticatedClient(ownerToken)
			const response = await authClient.api.contracts.post({
				propertyId,
				tenantId,
				startDate: startDate.toISOString().split('T')[0],
				endDate: endDate.toISOString().split('T')[0],
				rentalAmount: 200000,
				paymentDay: 10,
				depositAmount: 400000,
				notes: 'Contrato de 12 meses',
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data?.propertyId).toBe(propertyId)
			expect(response.data?.data?.tenantId).toBe(tenantId)
			expect(response.data?.data?.rentalAmount).toBe(200000)
			expect(response.data?.data?.status).toBe(CONTRACT_STATUS.ACTIVE)

			// Verify property status changed to rented
			const updatedProperty = await propertyRepository.findById(propertyId)
			expect(updatedProperty?.status).toBe(PROPERTY_STATUS.RENTED)
		})

		test('manager should create a contract successfully', async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const response = await client.api.contracts.post(
				{
					propertyId,
					tenantId,
					startDate: startDate.toISOString().split('T')[0],
					endDate: endDate.toISOString().split('T')[0],
					rentalAmount: 200000,
					paymentDay: 5,
				},
				{
					headers: { Authorization: `Bearer ${managerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
		})

		test('broker should create a contract for their property', async () => {
			// Create a tenant that the broker created
			const brokerTenant = await tenantRepository.create({
				companyId,
				name: 'Broker Tenant',
				cpf: '11122233344',
				createdBy: brokerId,
			})

			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const response = await client.api.contracts.post(
				{
					propertyId,
					tenantId: brokerTenant.id,
					startDate: startDate.toISOString().split('T')[0],
					endDate: endDate.toISOString().split('T')[0],
					rentalAmount: 200000,
					paymentDay: 15,
				},
				{
					headers: { Authorization: `Bearer ${brokerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.data?.brokerId).toBe(brokerId)
		})

		test('should fail without authentication', async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const response = await client.api.contracts.post({
				propertyId,
				tenantId,
				startDate: startDate.toISOString().split('T')[0],
				endDate: endDate.toISOString().split('T')[0],
				rentalAmount: 200000,
				paymentDay: 5,
			})

			expect(response.status).toBe(401)
		})

		test('should fail when property already has active contract', async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			// Create first contract
			await client.api.contracts.post(
				{
					propertyId,
					tenantId,
					startDate: startDate.toISOString().split('T')[0],
					endDate: endDate.toISOString().split('T')[0],
					rentalAmount: 200000,
					paymentDay: 5,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			// Try to create second contract for same property
			const response = await client.api.contracts.post(
				{
					propertyId,
					tenantId,
					startDate: startDate.toISOString().split('T')[0],
					endDate: endDate.toISOString().split('T')[0],
					rentalAmount: 200000,
					paymentDay: 5,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(400)
		})

		test('should fail with invalid property id', async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const response = await client.api.contracts.post(
				{
					propertyId: '00000000-0000-0000-0000-000000000000',
					tenantId,
					startDate: startDate.toISOString().split('T')[0],
					endDate: endDate.toISOString().split('T')[0],
					rentalAmount: 200000,
					paymentDay: 5,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(404)
		})

		test('should fail with invalid tenant id', async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const response = await client.api.contracts.post(
				{
					propertyId,
					tenantId: '00000000-0000-0000-0000-000000000000',
					startDate: startDate.toISOString().split('T')[0],
					endDate: endDate.toISOString().split('T')[0],
					rentalAmount: 200000,
					paymentDay: 5,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(404)
		})

		test('should fail when start date is after end date', async () => {
			const startDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
			const endDate = new Date()

			const response = await client.api.contracts.post(
				{
					propertyId,
					tenantId,
					startDate: startDate.toISOString().split('T')[0],
					endDate: endDate.toISOString().split('T')[0],
					rentalAmount: 200000,
					paymentDay: 5,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(400)
		})

		test('should fail with invalid payment day', async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const response = await client.api.contracts.post(
				{
					propertyId,
					tenantId,
					startDate: startDate.toISOString().split('T')[0],
					endDate: endDate.toISOString().split('T')[0],
					rentalAmount: 200000,
					paymentDay: 32,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(422)
		})
	})

	describe('GET /api/contracts', () => {
		beforeEach(async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			// Create properties and contracts
			const property1 = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property 1',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.RENTED,
				address: 'Rua A, 100',
				city: 'São Paulo',
				state: 'SP',
				createdBy: ownerId,
			})

			const property2 = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property 2',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.RENTED,
				address: 'Rua B, 200',
				city: 'Rio de Janeiro',
				state: 'RJ',
				brokerId,
				createdBy: brokerId,
			})

			const property3 = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property 3',
				type: PROPERTY_TYPES.COMMERCIAL,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Av. C, 300',
				city: 'Belo Horizonte',
				state: 'MG',
				createdBy: ownerId,
			})

			await contractRepository.create({
				companyId,
				propertyId: property1.id,
				ownerId: propertyOwnerId,
				tenantId,
				startDate,
				endDate,
				rentalAmount: 200000,
				paymentDay: 5,
				status: CONTRACT_STATUS.ACTIVE,
				createdBy: ownerId,
			})

			await contractRepository.create({
				companyId,
				propertyId: property2.id,
				ownerId: propertyOwnerId,
				tenantId,
				brokerId,
				startDate,
				endDate,
				rentalAmount: 300000,
				paymentDay: 10,
				status: CONTRACT_STATUS.ACTIVE,
				createdBy: brokerId,
			})

			await contractRepository.create({
				companyId,
				propertyId: property3.id,
				ownerId: propertyOwnerId,
				tenantId,
				startDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
				endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
				rentalAmount: 150000,
				paymentDay: 15,
				status: CONTRACT_STATUS.TERMINATED,
				createdBy: ownerId,
			})
		})

		test('owner should list all contracts', async () => {
			const response = await client.api.contracts.get({
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data?.length).toBe(3)
		})

		test('broker should list only their contracts', async () => {
			const response = await client.api.contracts.get({
				headers: { Authorization: `Bearer ${brokerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(1)
		})

		test('should filter by status', async () => {
			const response = await client.api.contracts.get({
				query: { status: CONTRACT_STATUS.ACTIVE },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(2)
		})

		test('should filter by tenant', async () => {
			const response = await client.api.contracts.get({
				query: { tenantId },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(3)
		})

		test('should paginate results', async () => {
			const response = await client.api.contracts.get({
				query: { page: 1, limit: 2 },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(2)
			expect(response.data?.pagination?.total).toBe(3)
			expect(response.data?.pagination?.totalPages).toBe(2)
		})
	})

	describe('GET /api/contracts/:id', () => {
		let contractId: string

		beforeEach(async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const contract = await contractRepository.create({
				companyId,
				propertyId,
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
			contractId = contract.id
		})

		test('should get contract by id', async () => {
			const response = await client.api.contracts({ id: contractId }).get({
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.id).toBe(contractId)
			expect(response.data?.data?.rentalAmount).toBe(200000)
		})

		test('broker should get their own contract', async () => {
			const response = await client.api.contracts({ id: contractId }).get({
				headers: { Authorization: `Bearer ${brokerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.id).toBe(contractId)
		})

		test('should return 404 for non-existent id', async () => {
			const response = await client.api
				.contracts({
					id: '00000000-0000-0000-0000-000000000000',
				})
				.get({
					headers: { Authorization: `Bearer ${ownerToken}` },
				})

			expect(response.status).toBe(404)
		})
	})

	describe('PATCH /api/contracts/:id', () => {
		let contractId: string

		beforeEach(async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			const contract = await contractRepository.create({
				companyId,
				propertyId,
				ownerId: propertyOwnerId,
				tenantId,
				startDate,
				endDate,
				rentalAmount: 200000,
				paymentDay: 5,
				status: CONTRACT_STATUS.ACTIVE,
				createdBy: ownerId,
			})
			contractId = contract.id
		})

		test('owner should update contract', async () => {
			const response = await client.api.contracts({ id: contractId }).patch(
				{
					rentalAmount: 250000,
					paymentDay: 15,
					notes: 'Valor reajustado',
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.data?.rentalAmount).toBe(250000)
			expect(response.data?.data?.paymentDay).toBe(15)
			expect(response.data?.data?.notes).toBe('Valor reajustado')
		})

		test('manager should update contract', async () => {
			const response = await client.api.contracts({ id: contractId }).patch(
				{
					depositAmount: 500000,
				},
				{
					headers: { Authorization: `Bearer ${managerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.data?.depositAmount).toBe(500000)
		})

		test('broker should not be able to update contract', async () => {
			const response = await client.api.contracts({ id: contractId }).patch(
				{
					rentalAmount: 300000,
				},
				{
					headers: { Authorization: `Bearer ${brokerToken}` },
				},
			)

			expect(response.status).toBe(403)
		})

		test('should return 404 for non-existent id', async () => {
			const response = await client.api
				.contracts({
					id: '00000000-0000-0000-0000-000000000000',
				})
				.patch(
					{ rentalAmount: 300000 },
					{
						headers: { Authorization: `Bearer ${ownerToken}` },
					},
				)

			expect(response.status).toBe(404)
		})
	})

	describe('POST /api/contracts/:id/terminate', () => {
		let contractId: string

		beforeEach(async () => {
			const startDate = new Date()
			const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

			// Mark property as rented
			await propertyRepository.update(propertyId, {
				status: PROPERTY_STATUS.RENTED,
			})

			const contract = await contractRepository.create({
				companyId,
				propertyId,
				ownerId: propertyOwnerId,
				tenantId,
				startDate,
				endDate,
				rentalAmount: 200000,
				paymentDay: 5,
				status: CONTRACT_STATUS.ACTIVE,
				createdBy: ownerId,
			})
			contractId = contract.id
		})

		test('owner should terminate contract', async () => {
			const authClient = createAuthenticatedClient(ownerToken)
			const response = await authClient.api.contracts({ id: contractId }).terminate.post({
				reason: 'Locatário solicitou rescisão',
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data?.status).toBe(CONTRACT_STATUS.TERMINATED)
			expect(response.data?.data?.terminationReason).toBe('Locatário solicitou rescisão')

			// Verify property status changed back to available
			const updatedProperty = await propertyRepository.findById(propertyId)
			expect(updatedProperty?.status).toBe(PROPERTY_STATUS.AVAILABLE)
		})

		test('manager should terminate contract', async () => {
			const response = await client.api.contracts({ id: contractId }).terminate.post(
				{},
				{
					headers: { Authorization: `Bearer ${managerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.data?.status).toBe(CONTRACT_STATUS.TERMINATED)
		})

		test('broker should not be able to terminate contract', async () => {
			const response = await client.api.contracts({ id: contractId }).terminate.post(
				{},
				{
					headers: { Authorization: `Bearer ${brokerToken}` },
				},
			)

			expect(response.status).toBe(403)
		})

		test('should fail to terminate already terminated contract', async () => {
			// First termination
			await client.api.contracts({ id: contractId }).terminate.post(
				{},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			// Second termination attempt
			const response = await client.api.contracts({ id: contractId }).terminate.post(
				{},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(400)
		})

		test('should return 404 for non-existent id', async () => {
			const response = await client.api
				.contracts({
					id: '00000000-0000-0000-0000-000000000000',
				})
				.terminate.post(
					{},
					{
						headers: { Authorization: `Bearer ${ownerToken}` },
					},
				)

			expect(response.status).toBe(404)
		})
	})
})
