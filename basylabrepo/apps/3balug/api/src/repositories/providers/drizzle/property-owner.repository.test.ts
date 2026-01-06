import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'
import { USER_ROLES } from '@/types/roles'
import { CompanyDrizzleRepository } from './company.repository'
import { PropertyOwnerDrizzleRepository } from './property-owner.repository'
import { UserDrizzleRepository } from './user.repository'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const connection = postgres(DATABASE_URL)
const db = drizzle(connection, { schema })

const testRunId = Date.now()

describe('PropertyOwnerDrizzleRepository', () => {
	const ownerRepo = new PropertyOwnerDrizzleRepository(db)
	const companyRepo = new CompanyDrizzleRepository(db)
	const userRepo = new UserDrizzleRepository(db)

	let testUserId: string
	let testCompanyId: string
	let testPropertyOwnerId: string
	let testBrokerId: string

	beforeAll(async () => {
		// Cleanup old test data
		await connection`DELETE FROM property_owners WHERE company_id IN (SELECT id FROM companies WHERE name LIKE 'PropOwner Repo Test%')`
		await connection`DELETE FROM companies WHERE name LIKE 'PropOwner Repo Test%'`
		await connection`DELETE FROM users WHERE email LIKE '%propowner-repo-test-%'`

		// Create test user (owner)
		const hashedPassword = await PasswordUtils.hash('Test@123')
		const user = await userRepo.create({
			email: `propowner-repo-test-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test User',
			role: USER_ROLES.OWNER,
			isActive: true,
		})
		testUserId = user.id

		// Create broker user
		const broker = await userRepo.create({
			email: `propowner-repo-broker-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test Broker',
			role: USER_ROLES.BROKER,
			isActive: true,
			createdBy: testUserId,
		})
		testBrokerId = broker.id

		// Create test company
		const company = await companyRepo.create({
			name: `PropOwner Repo Test Company ${testRunId}`,
			ownerId: testUserId,
		})
		testCompanyId = company.id

		// Update users with company
		await userRepo.update(testUserId, { companyId: testCompanyId })
		await userRepo.update(testBrokerId, { companyId: testCompanyId })
	})

	afterAll(async () => {
		// Cleanup in reverse order of creation
		if (testCompanyId) {
			await connection`DELETE FROM property_owners WHERE company_id = ${testCompanyId}`
			await connection`DELETE FROM companies WHERE id = ${testCompanyId}`
		}
		if (testUserId) {
			await connection`DELETE FROM users WHERE id = ${testUserId}`
		}
		if (testBrokerId) {
			await connection`DELETE FROM users WHERE id = ${testBrokerId}`
		}
		await connection.end()
	})

	describe('CRUD Operations', () => {
		test('should create a property owner', async () => {
			const owner = await ownerRepo.create({
				name: 'Test Property Owner',
				email: `testpropowner-${testRunId}@test.com`,
				phone: '11999999999',
				document: '123.456.789-01',
				companyId: testCompanyId,
				createdBy: testUserId,
			})

			expect(owner).toBeDefined()
			expect(owner.id).toBeDefined()
			expect(owner.name).toBe('Test Property Owner')
			expect(owner.document).toBe('12345678901') // Documento normalizado
			expect(owner.email).toBe(`testpropowner-${testRunId}@test.com`)

			testPropertyOwnerId = owner.id
		})

		test('should find property owner by id', async () => {
			const owner = await ownerRepo.findById(testPropertyOwnerId)

			expect(owner).toBeDefined()
			expect(owner?.id).toBe(testPropertyOwnerId)
			expect(owner?.name).toBe('Test Property Owner')
		})

		test('should return null for non-existent property owner', async () => {
			const owner = await ownerRepo.findById('00000000-0000-0000-0000-000000000000')
			expect(owner).toBeNull()
		})

		test('should update property owner', async () => {
			const updated = await ownerRepo.update(testPropertyOwnerId, {
				name: 'Updated Property Owner',
				phone: '11888888888',
			})

			expect(updated).toBeDefined()
			expect(updated?.name).toBe('Updated Property Owner')
			expect(updated?.phone).toBe('11888888888')
		})

		test('should update property owner document with normalization', async () => {
			const updated = await ownerRepo.update(testPropertyOwnerId, {
				document: '987.654.321-00',
			})

			expect(updated).toBeDefined()
			expect(updated?.document).toBe('98765432100')
		})

		test('should return null when updating non-existent property owner', async () => {
			const updated = await ownerRepo.update('00000000-0000-0000-0000-000000000000', {
				name: 'New Name',
			})
			expect(updated).toBeNull()
		})
	})

	describe('Find Operations', () => {
		test('should find property owner by document', async () => {
			const owner = await ownerRepo.findByDocument('987.654.321-00', testCompanyId)

			expect(owner).toBeDefined()
			expect(owner?.id).toBe(testPropertyOwnerId)
		})

		test('should find property owner by document without formatting', async () => {
			const owner = await ownerRepo.findByDocument('98765432100', testCompanyId)

			expect(owner).toBeDefined()
			expect(owner?.id).toBe(testPropertyOwnerId)
		})

		test('should return null when property owner document not found', async () => {
			const owner = await ownerRepo.findByDocument('00000000000', testCompanyId)
			expect(owner).toBeNull()
		})

		test('should find property owner by email', async () => {
			const owner = await ownerRepo.findByEmail(
				`testpropowner-${testRunId}@test.com`,
				testCompanyId,
			)

			expect(owner).toBeDefined()
			expect(owner?.id).toBe(testPropertyOwnerId)
		})

		test('should find property owner by email case insensitive', async () => {
			const owner = await ownerRepo.findByEmail(
				`TESTPROPOWNER-${testRunId}@TEST.COM`,
				testCompanyId,
			)

			expect(owner).toBeDefined()
			expect(owner?.id).toBe(testPropertyOwnerId)
		})

		test('should return null when property owner email not found', async () => {
			const owner = await ownerRepo.findByEmail('nonexistent@test.com', testCompanyId)
			expect(owner).toBeNull()
		})

		test('should find property owners by company id', async () => {
			const owners = await ownerRepo.findByCompanyId(testCompanyId)

			expect(owners).toBeDefined()
			expect(owners.length).toBeGreaterThanOrEqual(1)
			expect(owners.every((o) => o.companyId === testCompanyId)).toBe(true)
		})
	})

	describe('List with Filters', () => {
		beforeAll(async () => {
			// Create additional property owners for filter testing
			await ownerRepo.create({
				name: 'Maria Proprietária',
				email: `maria-prop-${testRunId}@test.com`,
				phone: '11777777777',
				document: '11111111111',
				companyId: testCompanyId,
				createdBy: testUserId,
			})

			await ownerRepo.create({
				name: 'João Dono',
				email: `joao-prop-${testRunId}@test.com`,
				phone: '11666666666',
				document: '22222222222',
				companyId: testCompanyId,
				createdBy: testBrokerId,
			})
		})

		test('should list property owners with basic filters', async () => {
			const result = await ownerRepo.list({
				companyId: testCompanyId,
				limit: 10,
				offset: 0,
			})

			expect(result.data).toBeDefined()
			expect(result.total).toBeGreaterThanOrEqual(3)
			expect(result.limit).toBe(10)
			expect(result.offset).toBe(0)
		})

		test('should list property owners filtered by createdBy', async () => {
			const result = await ownerRepo.list({
				companyId: testCompanyId,
				createdBy: testBrokerId,
			})

			expect(result.data.every((o) => o.createdBy === testBrokerId)).toBe(true)
		})

		test('should list property owners with search by name', async () => {
			const result = await ownerRepo.list({
				companyId: testCompanyId,
				search: 'Maria',
			})

			expect(result.data.length).toBeGreaterThanOrEqual(1)
			expect(result.data.some((o) => o.name.includes('Maria'))).toBe(true)
		})

		test('should list property owners with search by email', async () => {
			const result = await ownerRepo.list({
				companyId: testCompanyId,
				search: 'joao-prop',
			})

			expect(result.data.length).toBeGreaterThanOrEqual(1)
		})

		test('should list property owners with search by document', async () => {
			const result = await ownerRepo.list({
				companyId: testCompanyId,
				search: '11111111111',
			})

			expect(result.data.length).toBeGreaterThanOrEqual(1)
			expect(result.data.some((o) => o.document === '11111111111')).toBe(true)
		})

		test('should paginate results', async () => {
			const result = await ownerRepo.list({
				companyId: testCompanyId,
				limit: 1,
				offset: 0,
			})

			expect(result.data.length).toBe(1)
			expect(result.total).toBeGreaterThan(1)
		})

		test('should handle offset pagination', async () => {
			const firstPage = await ownerRepo.list({
				companyId: testCompanyId,
				limit: 1,
				offset: 0,
			})

			const secondPage = await ownerRepo.list({
				companyId: testCompanyId,
				limit: 1,
				offset: 1,
			})

			expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id)
		})
	})

	describe('Count Operations', () => {
		test('should count property owners by company id', async () => {
			const count = await ownerRepo.countByCompanyId(testCompanyId)
			expect(count).toBeGreaterThanOrEqual(3)
		})

		test('should return 0 for non-existent company', async () => {
			const count = await ownerRepo.countByCompanyId('00000000-0000-0000-0000-000000000000')
			expect(count).toBe(0)
		})
	})

	describe('Delete Operations', () => {
		test('should delete property owner', async () => {
			const owner = await ownerRepo.create({
				name: 'Owner to Delete',
				email: `delete-prop-${testRunId}@test.com`,
				phone: '11555555555',
				document: '33333333333',
				companyId: testCompanyId,
				createdBy: testUserId,
			})

			const deleted = await ownerRepo.delete(owner.id)
			expect(deleted).toBe(true)

			const found = await ownerRepo.findById(owner.id)
			expect(found).toBeNull()
		})

		test('should return false when deleting non-existent property owner', async () => {
			const deleted = await ownerRepo.delete('00000000-0000-0000-0000-000000000000')
			expect(deleted).toBe(false)
		})
	})
})
