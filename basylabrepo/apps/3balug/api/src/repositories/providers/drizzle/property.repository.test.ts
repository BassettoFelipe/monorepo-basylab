import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'
import { LISTING_TYPES, PROPERTY_STATUS, PROPERTY_TYPES } from '@/db/schema/properties'
import { USER_ROLES } from '@/types/roles'
import { CompanyDrizzleRepository } from './company.repository'
import { PropertyDrizzleRepository } from './property.repository'
import { PropertyOwnerDrizzleRepository } from './property-owner.repository'
import { UserDrizzleRepository } from './user.repository'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const connection = postgres(DATABASE_URL)
const db = drizzle(connection, { schema })

const testRunId = Date.now()

describe('PropertyDrizzleRepository', () => {
	const propertyRepo = new PropertyDrizzleRepository(db)
	const ownerRepo = new PropertyOwnerDrizzleRepository(db)
	const companyRepo = new CompanyDrizzleRepository(db)
	const userRepo = new UserDrizzleRepository(db)

	let testOwnerId: string
	let testCompanyId: string
	let testPropertyOwnerId: string
	let testPropertyId: string
	let testBrokerId: string

	beforeAll(async () => {
		// Cleanup old test data
		await connection`DELETE FROM properties WHERE company_id IN (SELECT id FROM companies WHERE name LIKE 'Property Repo Test%')`
		await connection`DELETE FROM property_owners WHERE company_id IN (SELECT id FROM companies WHERE name LIKE 'Property Repo Test%')`
		await connection`DELETE FROM companies WHERE name LIKE 'Property Repo Test%'`
		await connection`DELETE FROM users WHERE email LIKE '%property-repo-test-%'`

		// Create test user (owner)
		const hashedPassword = await PasswordUtils.hash('Test@123')
		const owner = await userRepo.create({
			email: `property-repo-test-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test Owner',
			role: USER_ROLES.OWNER,
			isActive: true,
		})
		testOwnerId = owner.id

		// Create broker user
		const broker = await userRepo.create({
			email: `property-repo-broker-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test Broker',
			role: USER_ROLES.BROKER,
			isActive: true,
			createdBy: testOwnerId,
		})
		testBrokerId = broker.id

		// Create test company
		const company = await companyRepo.create({
			name: `Property Repo Test Company ${testRunId}`,
			ownerId: testOwnerId,
		})
		testCompanyId = company.id

		// Update users with company
		await userRepo.update(testOwnerId, { companyId: testCompanyId })
		await userRepo.update(testBrokerId, { companyId: testCompanyId })

		// Create test property owner
		const propertyOwner = await ownerRepo.create({
			name: 'Test Property Owner',
			email: `propowner-${testRunId}@test.com`,
			phone: '11999999999',
			document: '12345678901',
			companyId: testCompanyId,
			createdBy: testOwnerId,
		})
		testPropertyOwnerId = propertyOwner.id
	})

	afterAll(async () => {
		// Cleanup in reverse order of creation
		if (testCompanyId) {
			await connection`DELETE FROM properties WHERE company_id = ${testCompanyId}`
			await connection`DELETE FROM property_owners WHERE company_id = ${testCompanyId}`
			await connection`DELETE FROM companies WHERE id = ${testCompanyId}`
		}
		if (testOwnerId) {
			await connection`DELETE FROM users WHERE id = ${testOwnerId}`
		}
		if (testBrokerId) {
			await connection`DELETE FROM users WHERE id = ${testBrokerId}`
		}
		await connection.end()
	})

	describe('CRUD Operations', () => {
		test('should create a property', async () => {
			const property = await propertyRepo.create({
				title: 'Test Property',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Teste, 123',
				neighborhood: 'Centro',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234-567',
				bedrooms: 3,
				bathrooms: 2,
				parkingSpaces: 1,
				area: 100,
				rentalPrice: 250000, // R$ 2.500,00
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
				brokerId: testBrokerId,
				createdBy: testOwnerId,
			})

			expect(property).toBeDefined()
			expect(property.id).toBeDefined()
			expect(property.title).toBe('Test Property')
			expect(property.type).toBe(PROPERTY_TYPES.APARTMENT)
			expect(property.status).toBe(PROPERTY_STATUS.AVAILABLE)
			expect(property.rentalPrice).toBe(250000)

			testPropertyId = property.id
		})

		test('should find property by id', async () => {
			const property = await propertyRepo.findById(testPropertyId)

			expect(property).toBeDefined()
			expect(property?.id).toBe(testPropertyId)
			expect(property?.title).toBe('Test Property')
		})

		test('should return null for non-existent property', async () => {
			const property = await propertyRepo.findById('00000000-0000-0000-0000-000000000000')
			expect(property).toBeNull()
		})

		test('should update property', async () => {
			const updated = await propertyRepo.update(testPropertyId, {
				title: 'Updated Property',
				rentalPrice: 280000,
				bedrooms: 4,
			})

			expect(updated).toBeDefined()
			expect(updated?.title).toBe('Updated Property')
			expect(updated?.rentalPrice).toBe(280000)
			expect(updated?.bedrooms).toBe(4)
		})

		test('should return null when updating non-existent property', async () => {
			const updated = await propertyRepo.update('00000000-0000-0000-0000-000000000000', {
				title: 'New Title',
			})
			expect(updated).toBeNull()
		})
	})

	describe('Find Operations', () => {
		test('should find properties by company id', async () => {
			const properties = await propertyRepo.findByCompanyId(testCompanyId)

			expect(properties).toBeDefined()
			expect(properties.length).toBeGreaterThanOrEqual(1)
			expect(properties.every((p) => p.companyId === testCompanyId)).toBe(true)
		})

		test('should find properties by owner id', async () => {
			const properties = await propertyRepo.findByOwnerId(testPropertyOwnerId)

			expect(properties).toBeDefined()
			expect(properties.length).toBeGreaterThanOrEqual(1)
			expect(properties.every((p) => p.ownerId === testPropertyOwnerId)).toBe(true)
		})

		test('should find properties by broker id', async () => {
			const properties = await propertyRepo.findByBrokerId(testBrokerId)

			expect(properties).toBeDefined()
			expect(properties.length).toBeGreaterThanOrEqual(1)
			expect(properties.every((p) => p.brokerId === testBrokerId)).toBe(true)
		})
	})

	describe('List with Filters', () => {
		beforeAll(async () => {
			// Create additional properties for filter testing
			await propertyRepo.create({
				title: 'House for Sale',
				type: PROPERTY_TYPES.HOUSE,
				listingType: LISTING_TYPES.SALE,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Casa, 456',
				city: 'Rio de Janeiro',
				state: 'RJ',
				zipCode: '20000-000',
				bedrooms: 5,
				bathrooms: 3,
				salePrice: 100000000, // R$ 1.000.000,00
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
				createdBy: testOwnerId,
			})

			await propertyRepo.create({
				title: 'Commercial Space',
				type: PROPERTY_TYPES.COMMERCIAL,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.RENTED,
				address: 'Av. Comercial, 789',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234-890',
				area: 200,
				rentalPrice: 500000, // R$ 5.000,00
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
				createdBy: testOwnerId,
			})
		})

		test('should list properties with basic filters', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				limit: 10,
				offset: 0,
			})

			expect(result.data).toBeDefined()
			expect(result.total).toBeGreaterThanOrEqual(3)
			expect(result.limit).toBe(10)
			expect(result.offset).toBe(0)
		})

		test('should list properties filtered by type', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				type: PROPERTY_TYPES.HOUSE,
			})

			expect(result.data.every((p) => p.type === PROPERTY_TYPES.HOUSE)).toBe(true)
		})

		test('should list properties filtered by listing type', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				listingType: LISTING_TYPES.RENT,
			})

			expect(result.data.every((p) => p.listingType === LISTING_TYPES.RENT)).toBe(true)
		})

		test('should list properties filtered by status', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				status: PROPERTY_STATUS.AVAILABLE,
			})

			expect(result.data.every((p) => p.status === PROPERTY_STATUS.AVAILABLE)).toBe(true)
		})

		test('should list properties filtered by city', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				city: 'São Paulo',
			})

			expect(result.data.every((p) => p.city?.includes('Paulo'))).toBe(true)
		})

		test('should list properties filtered by owner', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
			})

			expect(result.data.every((p) => p.ownerId === testPropertyOwnerId)).toBe(true)
		})

		test('should list properties filtered by broker', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				brokerId: testBrokerId,
			})

			expect(result.data.every((p) => p.brokerId === testBrokerId)).toBe(true)
		})

		test('should list properties filtered by rental price range', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				minRentalPrice: 200000,
				maxRentalPrice: 300000,
			})

			expect(
				result.data.every(
					(p) => p.rentalPrice !== null && p.rentalPrice >= 200000 && p.rentalPrice <= 300000,
				),
			).toBe(true)
		})

		test('should list properties filtered by bedrooms', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				minBedrooms: 4,
			})

			expect(result.data.every((p) => p.bedrooms !== null && p.bedrooms >= 4)).toBe(true)
		})

		test('should list properties with search', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				search: 'Commercial',
			})

			expect(result.data.length).toBeGreaterThanOrEqual(1)
			expect(result.data.some((p) => p.title.includes('Commercial'))).toBe(true)
		})

		test('should paginate results', async () => {
			const result = await propertyRepo.list({
				companyId: testCompanyId,
				limit: 1,
				offset: 0,
			})

			expect(result.data.length).toBe(1)
			expect(result.total).toBeGreaterThan(1)
		})
	})

	describe('Count Operations', () => {
		test('should count properties by company id', async () => {
			const count = await propertyRepo.countByCompanyId(testCompanyId)
			expect(count).toBeGreaterThanOrEqual(3)
		})

		test('should count properties by owner id', async () => {
			const count = await propertyRepo.countByOwnerId(testPropertyOwnerId)
			expect(count).toBeGreaterThanOrEqual(3)
		})

		test('should return 0 for non-existent company', async () => {
			const count = await propertyRepo.countByCompanyId('00000000-0000-0000-0000-000000000000')
			expect(count).toBe(0)
		})
	})

	describe('Stats Operations', () => {
		test('should get stats by company id', async () => {
			const stats = await propertyRepo.getStatsByCompanyId(testCompanyId)

			expect(stats).toBeDefined()
			expect(stats.total).toBeGreaterThanOrEqual(3)
			expect(typeof stats.available).toBe('number')
			expect(typeof stats.rented).toBe('number')
			expect(typeof stats.sold).toBe('number')
			expect(typeof stats.maintenance).toBe('number')
		})

		test('should get stats by broker id', async () => {
			const stats = await propertyRepo.getStatsByBrokerId(testBrokerId, testCompanyId)

			expect(stats).toBeDefined()
			expect(stats.total).toBeGreaterThanOrEqual(1)
		})

		test('should return empty stats for non-existent company', async () => {
			const stats = await propertyRepo.getStatsByCompanyId('00000000-0000-0000-0000-000000000000')

			expect(stats.total).toBe(0)
			expect(stats.available).toBe(0)
			expect(stats.rented).toBe(0)
		})
	})

	describe('Delete Operations', () => {
		test('should delete property', async () => {
			const property = await propertyRepo.create({
				title: 'Property to Delete',
				type: PROPERTY_TYPES.LAND,
				listingType: LISTING_TYPES.SALE,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Delete, 999',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234-567',
				salePrice: 50000000,
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
				createdBy: testOwnerId,
			})

			const deleted = await propertyRepo.delete(property.id)
			expect(deleted).toBe(true)

			const found = await propertyRepo.findById(property.id)
			expect(found).toBeNull()
		})

		test('should return false when deleting non-existent property', async () => {
			const deleted = await propertyRepo.delete('00000000-0000-0000-0000-000000000000')
			expect(deleted).toBe(false)
		})

		test('should delete property with photos', async () => {
			const property = await propertyRepo.create({
				title: 'Property with Photos to Delete',
				type: PROPERTY_TYPES.APARTMENT,
				listingType: LISTING_TYPES.RENT,
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Photos, 111',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234-567',
				rentalPrice: 150000,
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
				createdBy: testOwnerId,
			})

			// Delete with photos (even if there are no photos, the transaction should work)
			const deleted = await propertyRepo.deleteWithPhotos(property.id)
			expect(deleted).toBe(true)

			const found = await propertyRepo.findById(property.id)
			expect(found).toBeNull()
		})
	})
})
