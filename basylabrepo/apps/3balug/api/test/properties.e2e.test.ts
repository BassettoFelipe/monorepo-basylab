import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
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
	subscriptionRepository,
	planRepository,
} = createTestApp()

describe('Properties E2E', () => {
	let ownerToken: string
	let managerToken: string
	let brokerToken: string
	let broker2Token: string
	let companyId: string
	let ownerId: string
	let managerId: string
	let brokerId: string
	let broker2Id: string
	let propertyOwnerId: string
	let brokerPropertyOwnerId: string

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

		// Create second broker user
		const broker2 = await userRepository.create({
			email: 'broker2@test.com',
			password: 'hashedpassword',
			name: 'Broker 2 User',
			role: USER_ROLES.BROKER,
			companyId,
			isActive: true,
			isEmailVerified: true,
		})
		broker2Id = broker2.id

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

		await subscriptionRepository.create({
			userId: broker2Id,
			...subscriptionData,
		})

		// Create property owner (by owner)
		const propOwner = await propertyOwnerRepository.create({
			companyId,
			name: 'Property Owner',
			document: '12345678901',
			documentType: 'cpf',
			createdBy: ownerId,
		})
		propertyOwnerId = propOwner.id

		// Create property owner (by broker)
		const brokerPropOwner = await propertyOwnerRepository.create({
			companyId,
			name: 'Broker Property Owner',
			document: '98765432100',
			documentType: 'cpf',
			createdBy: brokerId,
		})
		brokerPropertyOwnerId = brokerPropOwner.id

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
	})

	afterAll(() => {
		clearTestData()
	})

	beforeEach(() => {
		propertyRepository.clear()
	})

	describe('POST /api/properties', () => {
		test('owner should create a property successfully', async () => {
			const response = await client.api.properties.post(
				{
					ownerId: propertyOwnerId,
					title: 'Apartamento Centro',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					address: 'Rua Principal, 100',
					city: 'São Paulo',
					state: 'SP',
					bedrooms: 2,
					bathrooms: 1,
					rentalPrice: 200000,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data?.title).toBe('Apartamento Centro')
			expect(response.data?.data?.type).toBe(PROPERTY_TYPES.APARTMENT)
			expect(response.data?.data?.status).toBe(PROPERTY_STATUS.AVAILABLE)
		})

		test('manager should create a property successfully', async () => {
			const response = await client.api.properties.post(
				{
					ownerId: propertyOwnerId,
					title: 'Casa Jardins',
					type: PROPERTY_TYPES.HOUSE,
					listingType: LISTING_TYPES.SALE,
					address: 'Rua das Flores, 200',
					city: 'São Paulo',
					state: 'SP',
					salePrice: 50000000,
				},
				{
					headers: { Authorization: `Bearer ${managerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
		})

		test('broker should create a property and be assigned as responsible', async () => {
			const response = await client.api.properties.post(
				{
					ownerId: brokerPropertyOwnerId,
					title: 'Terreno Industrial',
					type: PROPERTY_TYPES.LAND,
					listingType: LISTING_TYPES.BOTH,
					address: 'Rodovia Industrial, KM 10',
					city: 'Campinas',
					state: 'SP',
					area: 1000,
					rentalPrice: 100000,
					salePrice: 5000000,
				},
				{
					headers: { Authorization: `Bearer ${brokerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.data?.brokerId).toBe(brokerId)
		})

		test('should fail without authentication', async () => {
			const response = await client.api.properties.post({
				ownerId: propertyOwnerId,
				title: 'Test Property',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.RENT,
				address: 'Rua Teste, 123',
				city: 'São Paulo',
				state: 'SP',
			})

			expect(response.status).toBe(401)
		})

		test('should fail with invalid owner id', async () => {
			const response = await client.api.properties.post(
				{
					ownerId: '00000000-0000-0000-0000-000000000000',
					title: 'Test Property',
					type: PROPERTY_TYPES.HOUSE,
					listingType: LISTING_TYPES.RENT,
					address: 'Rua Teste, 456',
					city: 'São Paulo',
					state: 'SP',
					rentalPrice: 100000,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(404)
		})

		test('should create property with all optional fields', async () => {
			const response = await client.api.properties.post(
				{
					ownerId: propertyOwnerId,
					title: 'Apartamento Completo',
					description: 'Apartamento completo com vista para o mar',
					type: PROPERTY_TYPES.APARTMENT,
					listingType: LISTING_TYPES.RENT,
					address: 'Av. Beira Mar, 500',
					neighborhood: 'Copacabana',
					city: 'Rio de Janeiro',
					state: 'RJ',
					zipCode: '22070-000',
					area: 120,
					bedrooms: 3,
					bathrooms: 2,
					parkingSpaces: 1,
					rentalPrice: 500000,
					condoFee: 80000,
					iptuPrice: 50000,
					features: { hasPool: true, hasGym: true, hasBalcony: true },
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.data?.description).toBe('Apartamento completo com vista para o mar')
			expect(response.data?.data?.features).toEqual({
				hasPool: true,
				hasGym: true,
				hasBalcony: true,
			})
		})
	})

	describe('GET /api/properties', () => {
		beforeEach(async () => {
			await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property A',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua A, 100',
				city: 'São Paulo',
				state: 'SP',
				rentalPrice: 200000,
				createdBy: ownerId,
			})
			await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property B',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.SALE,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Av. B, 200',
				city: 'Rio de Janeiro',
				state: 'RJ',
				salePrice: 50000000,
				brokerId,
				createdBy: brokerId,
			})
			await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Property C',
				type: PROPERTY_TYPES.COMMERCIAL,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.RENTED,
				address: 'Rua C, 300',
				city: 'Belo Horizonte',
				state: 'MG',
				brokerId: broker2Id,
				createdBy: broker2Id,
			})
		})

		test('owner should list all properties', async () => {
			const response = await client.api.properties.get({
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)
			expect(response.data?.data?.length).toBe(3)
		})

		test('broker should list only their own properties', async () => {
			const response = await client.api.properties.get({
				headers: { Authorization: `Bearer ${brokerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(1)
			expect(response.data?.data?.[0]?.title).toBe('Property B')
		})

		test('should filter by type', async () => {
			const response = await client.api.properties.get({
				query: { type: PROPERTY_TYPES.HOUSE },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(1)
			expect(response.data?.data?.[0]?.title).toBe('Property A')
		})

		test('should filter by listing type', async () => {
			const response = await client.api.properties.get({
				query: { listingType: LISTING_TYPES.SALE },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(1)
		})

		test('should filter by status', async () => {
			const response = await client.api.properties.get({
				query: { status: PROPERTY_STATUS.RENTED },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(1)
			expect(response.data?.data?.[0]?.title).toBe('Property C')
		})

		test('should filter by city', async () => {
			const response = await client.api.properties.get({
				query: { city: 'São Paulo' },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(1)
		})

		test('should filter by search term', async () => {
			const response = await client.api.properties.get({
				query: { search: 'Property A' },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(1)
		})

		test('should paginate results', async () => {
			const response = await client.api.properties.get({
				query: { limit: 2, offset: 0 },
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.length).toBe(2)
			expect(response.data?.total).toBe(3)
		})
	})

	describe('GET /api/properties/:id', () => {
		let propertyId: string

		beforeEach(async () => {
			const property = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Test Property',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Teste, 999',
				city: 'São Paulo',
				state: 'SP',
				brokerId,
				createdBy: brokerId,
			})
			propertyId = property.id
		})

		test('should get property by id', async () => {
			const response = await client.api.properties({ id: propertyId }).get({
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.title).toBe('Test Property')
		})

		test('broker should get their own property', async () => {
			const response = await client.api.properties({ id: propertyId }).get({
				headers: { Authorization: `Bearer ${brokerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.data?.title).toBe('Test Property')
		})

		test('other broker should not access property', async () => {
			const response = await client.api.properties({ id: propertyId }).get({
				headers: { Authorization: `Bearer ${broker2Token}` },
			})

			expect(response.status).toBe(403)
		})

		test('should return 404 for non-existent id', async () => {
			const response = await client.api
				.properties({
					id: '00000000-0000-0000-0000-000000000000',
				})
				.get({
					headers: { Authorization: `Bearer ${ownerToken}` },
				})

			expect(response.status).toBe(404)
		})
	})

	describe('PATCH /api/properties/:id', () => {
		let propertyId: string

		beforeEach(async () => {
			const property = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'Original Title',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Original, 777',
				city: 'Curitiba',
				state: 'PR',
				rentalPrice: 200000,
				createdBy: ownerId,
			})
			propertyId = property.id
		})

		test('owner should update property', async () => {
			const response = await client.api.properties({ id: propertyId }).patch(
				{
					title: 'Updated Title',
					rentalPrice: 300000,
					status: PROPERTY_STATUS.MAINTENANCE,
				},
				{
					headers: { Authorization: `Bearer ${ownerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.data?.title).toBe('Updated Title')
			expect(response.data?.data?.rentalPrice).toBe(300000)
			expect(response.data?.data?.status).toBe(PROPERTY_STATUS.MAINTENANCE)
		})

		test('manager should update property', async () => {
			const response = await client.api.properties({ id: propertyId }).patch(
				{
					bedrooms: 4,
					bathrooms: 3,
				},
				{
					headers: { Authorization: `Bearer ${managerToken}` },
				},
			)

			expect(response.status).toBe(200)
			expect(response.data?.data?.bedrooms).toBe(4)
			expect(response.data?.data?.bathrooms).toBe(3)
		})

		test('should return 404 for non-existent id', async () => {
			const response = await client.api
				.properties({
					id: '00000000-0000-0000-0000-000000000000',
				})
				.patch(
					{ title: 'Test' },
					{
						headers: { Authorization: `Bearer ${ownerToken}` },
					},
				)

			expect(response.status).toBe(404)
		})
	})

	describe('DELETE /api/properties/:id', () => {
		let propertyId: string

		beforeEach(async () => {
			const property = await propertyRepository.create({
				companyId,
				ownerId: propertyOwnerId,
				title: 'To Delete',
				type: PROPERTY_TYPES.LAND,
				listingType: LISTING_TYPES.SALE,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Terreno a Deletar, Lote 10',
				city: 'Brasília',
				state: 'DF',
				createdBy: ownerId,
			})
			propertyId = property.id
		})

		test('owner should delete property', async () => {
			const response = await client.api.properties({ id: propertyId }).delete(undefined, {
				headers: { Authorization: `Bearer ${ownerToken}` },
			})

			expect(response.status).toBe(200)
			expect(response.data?.success).toBe(true)

			// Verify deletion
			const deleted = await propertyRepository.findById(propertyId)
			expect(deleted).toBeNull()
		})

		test('manager should delete property', async () => {
			const response = await client.api.properties({ id: propertyId }).delete(undefined, {
				headers: { Authorization: `Bearer ${managerToken}` },
			})

			expect(response.status).toBe(200)
		})

		test('should return 404 for non-existent id', async () => {
			const response = await client.api
				.properties({
					id: '00000000-0000-0000-0000-000000000000',
				})
				.delete(undefined, {
					headers: { Authorization: `Bearer ${ownerToken}` },
				})

			expect(response.status).toBe(404)
		})
	})
})
