import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'
import { CONTRACT_STATUS } from '@/db/schema/contracts'
import { PROPERTY_STATUS } from '@/db/schema/properties'
import { USER_ROLES } from '@/types/roles'
import { CompanyDrizzleRepository } from './company.repository'
import { ContractDrizzleRepository } from './contract.repository'
import { PropertyDrizzleRepository } from './property.repository'
import { PropertyOwnerDrizzleRepository } from './property-owner.repository'
import { TenantDrizzleRepository } from './tenant.repository'
import { UserDrizzleRepository } from './user.repository'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const connection = postgres(DATABASE_URL)
const db = drizzle(connection, { schema })

const testRunId = Date.now()

describe('ContractDrizzleRepository', () => {
	const contractRepo = new ContractDrizzleRepository(db)
	const propertyRepo = new PropertyDrizzleRepository(db)
	const tenantRepo = new TenantDrizzleRepository(db)
	const ownerRepo = new PropertyOwnerDrizzleRepository(db)
	const companyRepo = new CompanyDrizzleRepository(db)
	const userRepo = new UserDrizzleRepository(db)

	let testOwnerId: string
	let testCompanyId: string
	let testPropertyId: string
	let testTenantId: string
	let testPropertyOwnerId: string
	let testContractId: string
	let testBrokerId: string

	beforeAll(async () => {
		// Cleanup old test data
		await connection`DELETE FROM contracts WHERE company_id IN (SELECT id FROM companies WHERE name LIKE 'Contract Repo Test%')`
		await connection`DELETE FROM properties WHERE company_id IN (SELECT id FROM companies WHERE name LIKE 'Contract Repo Test%')`
		await connection`DELETE FROM tenants WHERE company_id IN (SELECT id FROM companies WHERE name LIKE 'Contract Repo Test%')`
		await connection`DELETE FROM property_owners WHERE company_id IN (SELECT id FROM companies WHERE name LIKE 'Contract Repo Test%')`
		await connection`DELETE FROM companies WHERE name LIKE 'Contract Repo Test%'`
		await connection`DELETE FROM users WHERE email LIKE '%contract-repo-test-%'`

		// Create test user (owner)
		const hashedPassword = await PasswordUtils.hash('Test@123')
		const owner = await userRepo.create({
			email: `contract-repo-test-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test Owner',
			role: USER_ROLES.OWNER,
			isActive: true,
		})
		testOwnerId = owner.id

		// Create broker user
		const broker = await userRepo.create({
			email: `contract-repo-broker-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test Broker',
			role: USER_ROLES.BROKER,
			isActive: true,
			createdBy: testOwnerId,
		})
		testBrokerId = broker.id

		// Create test company
		const company = await companyRepo.create({
			name: `Contract Repo Test Company ${testRunId}`,
			ownerId: testOwnerId,
		})
		testCompanyId = company.id

		// Update users with company
		await userRepo.update(testOwnerId, { companyId: testCompanyId })
		await userRepo.update(testBrokerId, { companyId: testCompanyId })

		// Create test property owner
		const propertyOwner = await ownerRepo.create({
			name: 'Test Property Owner',
			email: `owner-${testRunId}@test.com`,
			phone: '11999999999',
			document: '12345678901',
			companyId: testCompanyId,
			createdBy: testOwnerId,
		})
		testPropertyOwnerId = propertyOwner.id

		// Create test property
		const property = await propertyRepo.create({
			title: 'Test Property for Contract',
			type: 'apartment',
			listingType: 'rent',
			status: PROPERTY_STATUS.AVAILABLE,
			address: 'Rua Teste, 123',
			city: 'São Paulo',
			state: 'SP',
			zipCode: '01234-567',
			rentalPrice: 2500,
			companyId: testCompanyId,
			ownerId: testPropertyOwnerId,
			createdBy: testOwnerId,
		})
		testPropertyId = property.id

		// Create test tenant
		const tenant = await tenantRepo.create({
			name: 'Test Tenant',
			email: `tenant-${testRunId}@test.com`,
			phone: '11888888888',
			cpf: '12345678901',
			companyId: testCompanyId,
			createdBy: testOwnerId,
		})
		testTenantId = tenant.id
	})

	afterAll(async () => {
		// Cleanup in reverse order of creation
		if (testCompanyId) {
			await connection`DELETE FROM contracts WHERE company_id = ${testCompanyId}`
			await connection`DELETE FROM properties WHERE company_id = ${testCompanyId}`
			await connection`DELETE FROM tenants WHERE company_id = ${testCompanyId}`
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
		test('should create a contract', async () => {
			const startDate = new Date()
			const endDate = new Date()
			endDate.setFullYear(endDate.getFullYear() + 1)

			const contract = await contractRepo.create({
				propertyId: testPropertyId,
				tenantId: testTenantId,
				ownerId: testPropertyOwnerId,
				companyId: testCompanyId,
				brokerId: testBrokerId,
				status: CONTRACT_STATUS.ACTIVE,
				startDate,
				endDate,
				rentalAmount: 2500,
				paymentDay: 10,
				createdBy: testOwnerId,
			})

			expect(contract).toBeDefined()
			expect(contract.id).toBeDefined()
			expect(contract.propertyId).toBe(testPropertyId)
			expect(contract.tenantId).toBe(testTenantId)
			expect(contract.status).toBe(CONTRACT_STATUS.ACTIVE)
			expect(contract.rentalAmount).toBe(2500)

			testContractId = contract.id
		})

		test('should find contract by id', async () => {
			const contract = await contractRepo.findById(testContractId)

			expect(contract).toBeDefined()
			expect(contract?.id).toBe(testContractId)
			expect(contract?.propertyId).toBe(testPropertyId)
		})

		test('should return null for non-existent contract', async () => {
			const contract = await contractRepo.findById('00000000-0000-0000-0000-000000000000')
			expect(contract).toBeNull()
		})

		test('should update contract', async () => {
			const updated = await contractRepo.update(testContractId, {
				rentalAmount: 2800,
				paymentDay: 15,
			})

			expect(updated).toBeDefined()
			expect(updated?.rentalAmount).toBe(2800)
			expect(updated?.paymentDay).toBe(15)
		})

		test('should return null when updating non-existent contract', async () => {
			const updated = await contractRepo.update('00000000-0000-0000-0000-000000000000', {
				rentalAmount: 3000,
			})
			expect(updated).toBeNull()
		})
	})

	describe('Find Operations', () => {
		test('should find contracts by property id', async () => {
			const contracts = await contractRepo.findByPropertyId(testPropertyId)

			expect(contracts).toBeDefined()
			expect(contracts.length).toBeGreaterThanOrEqual(1)
			expect(contracts.some((c) => c.id === testContractId)).toBe(true)
		})

		test('should find active contract by property id', async () => {
			const contract = await contractRepo.findActiveByPropertyId(testPropertyId)

			expect(contract).toBeDefined()
			expect(contract?.propertyId).toBe(testPropertyId)
			expect(contract?.status).toBe(CONTRACT_STATUS.ACTIVE)
		})

		test('should find contracts by tenant id', async () => {
			const contracts = await contractRepo.findByTenantId(testTenantId)

			expect(contracts).toBeDefined()
			expect(contracts.length).toBeGreaterThanOrEqual(1)
			expect(contracts.some((c) => c.tenantId === testTenantId)).toBe(true)
		})

		test('should find active contracts by tenant id', async () => {
			const contracts = await contractRepo.findActiveByTenantId(testTenantId)

			expect(contracts).toBeDefined()
			expect(contracts.length).toBeGreaterThanOrEqual(1)
			expect(contracts.every((c) => c.status === CONTRACT_STATUS.ACTIVE)).toBe(true)
		})

		test('should find contracts by company id', async () => {
			const contracts = await contractRepo.findByCompanyId(testCompanyId)

			expect(contracts).toBeDefined()
			expect(contracts.length).toBeGreaterThanOrEqual(1)
			expect(contracts.every((c) => c.companyId === testCompanyId)).toBe(true)
		})

		test('should find contracts by broker id', async () => {
			const contracts = await contractRepo.findByBrokerId(testBrokerId)

			expect(contracts).toBeDefined()
			expect(contracts.length).toBeGreaterThanOrEqual(1)
			expect(contracts.every((c) => c.brokerId === testBrokerId)).toBe(true)
		})
	})

	describe('List with Filters', () => {
		test('should list contracts with basic filters', async () => {
			const result = await contractRepo.list({
				companyId: testCompanyId,
				limit: 10,
				offset: 0,
			})

			expect(result.data).toBeDefined()
			expect(result.total).toBeGreaterThanOrEqual(1)
			expect(result.limit).toBe(10)
			expect(result.offset).toBe(0)
		})

		test('should list contracts filtered by status', async () => {
			const result = await contractRepo.list({
				companyId: testCompanyId,
				status: CONTRACT_STATUS.ACTIVE,
			})

			expect(result.data.every((c) => c.status === CONTRACT_STATUS.ACTIVE)).toBe(true)
		})

		test('should list contracts filtered by property', async () => {
			const result = await contractRepo.list({
				companyId: testCompanyId,
				propertyId: testPropertyId,
			})

			expect(result.data.every((c) => c.propertyId === testPropertyId)).toBe(true)
		})

		test('should list contracts filtered by tenant', async () => {
			const result = await contractRepo.list({
				companyId: testCompanyId,
				tenantId: testTenantId,
			})

			expect(result.data.every((c) => c.tenantId === testTenantId)).toBe(true)
		})

		test('should list contracts filtered by broker', async () => {
			const result = await contractRepo.list({
				companyId: testCompanyId,
				brokerId: testBrokerId,
			})

			expect(result.data.every((c) => c.brokerId === testBrokerId)).toBe(true)
		})

		test('should list contracts filtered by owner', async () => {
			const result = await contractRepo.list({
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
			})

			expect(result.data.every((c) => c.ownerId === testPropertyOwnerId)).toBe(true)
		})

		test('should list contracts filtered by date range', async () => {
			const startDateFrom = new Date()
			startDateFrom.setMonth(startDateFrom.getMonth() - 1)
			const startDateTo = new Date()
			startDateTo.setMonth(startDateTo.getMonth() + 1)

			const result = await contractRepo.list({
				companyId: testCompanyId,
				startDateFrom,
				startDateTo,
			})

			expect(result.data).toBeDefined()
		})

		test('should paginate results', async () => {
			const result = await contractRepo.list({
				companyId: testCompanyId,
				limit: 1,
				offset: 0,
			})

			expect(result.data.length).toBeLessThanOrEqual(1)
		})
	})

	describe('Count Operations', () => {
		test('should count contracts by company id', async () => {
			const count = await contractRepo.countByCompanyId(testCompanyId)
			expect(count).toBeGreaterThanOrEqual(1)
		})

		test('should count active contracts by company id', async () => {
			const count = await contractRepo.countActiveByCompanyId(testCompanyId)
			expect(count).toBeGreaterThanOrEqual(1)
		})

		test('should count contracts by tenant id', async () => {
			const count = await contractRepo.countByTenantId(testTenantId)
			expect(count).toBeGreaterThanOrEqual(1)
		})

		test('should count active contracts by tenant id', async () => {
			const count = await contractRepo.countActiveByTenantId(testTenantId)
			expect(count).toBeGreaterThanOrEqual(1)
		})

		test('should return 0 for non-existent company', async () => {
			const count = await contractRepo.countByCompanyId('00000000-0000-0000-0000-000000000000')
			expect(count).toBe(0)
		})
	})

	describe('Stats Operations', () => {
		test('should get stats by company id', async () => {
			const stats = await contractRepo.getStatsByCompanyId(testCompanyId)

			expect(stats).toBeDefined()
			expect(stats.total).toBeGreaterThanOrEqual(1)
			expect(stats.active).toBeGreaterThanOrEqual(1)
			expect(typeof stats.monthlyRevenue).toBe('number')
		})

		test('should get stats by broker id', async () => {
			const stats = await contractRepo.getStatsByBrokerId(testBrokerId, testCompanyId)

			expect(stats).toBeDefined()
			expect(stats.total).toBeGreaterThanOrEqual(1)
			expect(typeof stats.monthlyRevenue).toBe('number')
		})

		test('should return empty stats for non-existent company', async () => {
			const stats = await contractRepo.getStatsByCompanyId('00000000-0000-0000-0000-000000000000')

			expect(stats.total).toBe(0)
			expect(stats.active).toBe(0)
			expect(stats.monthlyRevenue).toBe(0)
		})
	})

	describe('Expiring Contracts', () => {
		let expiringContractId: string

		beforeAll(async () => {
			// Create a contract expiring in 15 days
			const startDate = new Date()
			startDate.setFullYear(startDate.getFullYear() - 1)
			const endDate = new Date()
			endDate.setDate(endDate.getDate() + 15)

			// Create another property for expiring contract
			const property = await propertyRepo.create({
				title: 'Expiring Contract Property',
				type: 'house',
				listingType: 'rent',
				status: PROPERTY_STATUS.RENTED,
				address: 'Rua Expirando, 456',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234-567',
				rentalPrice: 3000,
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
				createdBy: testOwnerId,
			})

			const contract = await contractRepo.create({
				propertyId: property.id,
				tenantId: testTenantId,
				ownerId: testPropertyOwnerId,
				companyId: testCompanyId,
				brokerId: testBrokerId,
				status: CONTRACT_STATUS.ACTIVE,
				startDate,
				endDate,
				rentalAmount: 3000,
				paymentDay: 5,
				createdBy: testOwnerId,
			})
			expiringContractId = contract.id
		})

		test('should find expiring contracts within days ahead', async () => {
			const contracts = await contractRepo.findExpiringContracts(testCompanyId, 30)

			expect(contracts).toBeDefined()
			expect(contracts.some((c) => c.id === expiringContractId)).toBe(true)
		})

		test('should not find expiring contracts with short window', async () => {
			const contracts = await contractRepo.findExpiringContracts(testCompanyId, 5)

			expect(contracts.some((c) => c.id === expiringContractId)).toBe(false)
		})

		test('should find expiring contracts by broker', async () => {
			const contracts = await contractRepo.findExpiringContractsByBroker(
				testCompanyId,
				testBrokerId,
				30,
			)

			expect(contracts).toBeDefined()
			expect(contracts.every((c) => c.brokerId === testBrokerId)).toBe(true)
		})
	})

	describe('Transaction Operations', () => {
		let transactionPropertyId: string
		let transactionContractId: string

		beforeAll(async () => {
			const property = await propertyRepo.create({
				title: 'Transaction Test Property',
				type: 'apartment',
				listingType: 'rent',
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Transação, 789',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234-567',
				rentalPrice: 2000,
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
				createdBy: testOwnerId,
			})
			transactionPropertyId = property.id
		})

		test('should create contract and update property status in transaction', async () => {
			const startDate = new Date()
			const endDate = new Date()
			endDate.setFullYear(endDate.getFullYear() + 1)

			const contract = await contractRepo.createWithPropertyUpdate(
				{
					propertyId: transactionPropertyId,
					tenantId: testTenantId,
					ownerId: testPropertyOwnerId,
					companyId: testCompanyId,
					brokerId: testBrokerId,
					status: CONTRACT_STATUS.ACTIVE,
					startDate,
					endDate,
					rentalAmount: 2000,
					paymentDay: 10,
					createdBy: testOwnerId,
				},
				transactionPropertyId,
				PROPERTY_STATUS.RENTED,
			)

			expect(contract).toBeDefined()
			expect(contract.id).toBeDefined()

			// Verify property status was updated
			const property = await propertyRepo.findById(transactionPropertyId)
			expect(property?.status).toBe(PROPERTY_STATUS.RENTED)

			transactionContractId = contract.id
		})

		test('should terminate contract and update property status in transaction', async () => {
			const terminatedContract = await contractRepo.terminateWithPropertyUpdate(
				transactionContractId,
				transactionPropertyId,
				{
					terminatedAt: new Date(),
					terminationReason: 'Test termination',
				},
			)

			expect(terminatedContract).toBeDefined()
			expect(terminatedContract.status).toBe(CONTRACT_STATUS.TERMINATED)
			expect(terminatedContract.terminationReason).toBe('Test termination')

			// Verify property status was updated back to available
			const property = await propertyRepo.findById(transactionPropertyId)
			expect(property?.status).toBe(PROPERTY_STATUS.AVAILABLE)
		})
	})

	describe('Delete Operations', () => {
		test('should delete contract', async () => {
			const startDate = new Date()
			const endDate = new Date()
			endDate.setFullYear(endDate.getFullYear() + 1)

			// Create a property for this contract
			const property = await propertyRepo.create({
				title: 'Delete Test Property',
				type: 'apartment',
				listingType: 'rent',
				status: PROPERTY_STATUS.AVAILABLE,
				address: 'Rua Delete, 999',
				city: 'São Paulo',
				state: 'SP',
				zipCode: '01234-567',
				rentalPrice: 1500,
				companyId: testCompanyId,
				ownerId: testPropertyOwnerId,
				createdBy: testOwnerId,
			})

			const contract = await contractRepo.create({
				propertyId: property.id,
				tenantId: testTenantId,
				ownerId: testPropertyOwnerId,
				companyId: testCompanyId,
				status: CONTRACT_STATUS.ACTIVE,
				startDate,
				endDate,
				rentalAmount: 1500,
				paymentDay: 10,
				createdBy: testOwnerId,
			})

			const deleted = await contractRepo.delete(contract.id)
			expect(deleted).toBe(true)

			const found = await contractRepo.findById(contract.id)
			expect(found).toBeNull()

			// Cleanup property
			await propertyRepo.delete(property.id)
		})

		test('should return false when deleting non-existent contract', async () => {
			const deleted = await contractRepo.delete('00000000-0000-0000-0000-000000000000')
			expect(deleted).toBe(false)
		})
	})
})
