import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'
import { USER_ROLES } from '@/types/roles'
import { CompanyDrizzleRepository } from './company.repository'
import { TenantDrizzleRepository } from './tenant.repository'
import { UserDrizzleRepository } from './user.repository'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const connection = postgres(DATABASE_URL)
const db = drizzle(connection, { schema })

const testRunId = Date.now()

describe('TenantDrizzleRepository', () => {
	const tenantRepo = new TenantDrizzleRepository(db)
	const companyRepo = new CompanyDrizzleRepository(db)
	const userRepo = new UserDrizzleRepository(db)

	let testOwnerId: string
	let testCompanyId: string
	let testTenantId: string
	let testBrokerId: string

	beforeAll(async () => {
		// Cleanup old test data
		await connection`DELETE FROM tenants WHERE company_id IN (SELECT id FROM companies WHERE name LIKE 'Tenant Repo Test%')`
		await connection`DELETE FROM companies WHERE name LIKE 'Tenant Repo Test%'`
		await connection`DELETE FROM users WHERE email LIKE '%tenant-repo-test-%'`

		// Create test user (owner)
		const hashedPassword = await PasswordUtils.hash('Test@123')
		const owner = await userRepo.create({
			email: `tenant-repo-test-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test Owner',
			role: USER_ROLES.OWNER,
			isActive: true,
		})
		testOwnerId = owner.id

		// Create broker user
		const broker = await userRepo.create({
			email: `tenant-repo-broker-${testRunId}@test.com`,
			password: hashedPassword,
			name: 'Test Broker',
			role: USER_ROLES.BROKER,
			isActive: true,
			createdBy: testOwnerId,
		})
		testBrokerId = broker.id

		// Create test company
		const company = await companyRepo.create({
			name: `Tenant Repo Test Company ${testRunId}`,
			ownerId: testOwnerId,
		})
		testCompanyId = company.id

		// Update users with company
		await userRepo.update(testOwnerId, { companyId: testCompanyId })
		await userRepo.update(testBrokerId, { companyId: testCompanyId })
	})

	afterAll(async () => {
		// Cleanup in reverse order of creation
		if (testCompanyId) {
			await connection`DELETE FROM tenants WHERE company_id = ${testCompanyId}`
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
		test('should create a tenant', async () => {
			const tenant = await tenantRepo.create({
				name: 'Test Tenant',
				email: `testtenant-${testRunId}@test.com`,
				phone: '11999999999',
				cpf: '123.456.789-01',
				companyId: testCompanyId,
				createdBy: testOwnerId,
			})

			expect(tenant).toBeDefined()
			expect(tenant.id).toBeDefined()
			expect(tenant.name).toBe('Test Tenant')
			expect(tenant.cpf).toBe('12345678901') // CPF normalizado
			expect(tenant.email).toBe(`testtenant-${testRunId}@test.com`)

			testTenantId = tenant.id
		})

		test('should find tenant by id', async () => {
			const tenant = await tenantRepo.findById(testTenantId)

			expect(tenant).toBeDefined()
			expect(tenant?.id).toBe(testTenantId)
			expect(tenant?.name).toBe('Test Tenant')
		})

		test('should return null for non-existent tenant', async () => {
			const tenant = await tenantRepo.findById('00000000-0000-0000-0000-000000000000')
			expect(tenant).toBeNull()
		})

		test('should update tenant', async () => {
			const updated = await tenantRepo.update(testTenantId, {
				name: 'Updated Tenant',
				phone: '11888888888',
			})

			expect(updated).toBeDefined()
			expect(updated?.name).toBe('Updated Tenant')
			expect(updated?.phone).toBe('11888888888')
		})

		test('should update tenant cpf with normalization', async () => {
			const updated = await tenantRepo.update(testTenantId, {
				cpf: '987.654.321-00',
			})

			expect(updated).toBeDefined()
			expect(updated?.cpf).toBe('98765432100')
		})

		test('should return null when updating non-existent tenant', async () => {
			const updated = await tenantRepo.update('00000000-0000-0000-0000-000000000000', {
				name: 'New Name',
			})
			expect(updated).toBeNull()
		})
	})

	describe('Find Operations', () => {
		test('should find tenant by cpf', async () => {
			const tenant = await tenantRepo.findByCpf('987.654.321-00', testCompanyId)

			expect(tenant).toBeDefined()
			expect(tenant?.id).toBe(testTenantId)
		})

		test('should find tenant by cpf without formatting', async () => {
			const tenant = await tenantRepo.findByCpf('98765432100', testCompanyId)

			expect(tenant).toBeDefined()
			expect(tenant?.id).toBe(testTenantId)
		})

		test('should return null when tenant cpf not found', async () => {
			const tenant = await tenantRepo.findByCpf('00000000000', testCompanyId)
			expect(tenant).toBeNull()
		})

		test('should find tenant by document (alias for cpf)', async () => {
			const result = await tenantRepo.findByDocument('98765432100', testCompanyId)

			expect(result).toBeDefined()
			expect(result?.id).toBe(testTenantId)
		})

		test('should return null when document not found', async () => {
			const result = await tenantRepo.findByDocument('00000000000', testCompanyId)
			expect(result).toBeNull()
		})

		test('should find tenant by email', async () => {
			const tenant = await tenantRepo.findByEmail(`testtenant-${testRunId}@test.com`, testCompanyId)

			expect(tenant).toBeDefined()
			expect(tenant?.id).toBe(testTenantId)
		})

		test('should find tenant by email case insensitive', async () => {
			const tenant = await tenantRepo.findByEmail(`TESTTENANT-${testRunId}@TEST.COM`, testCompanyId)

			expect(tenant).toBeDefined()
			expect(tenant?.id).toBe(testTenantId)
		})

		test('should return null when tenant email not found', async () => {
			const tenant = await tenantRepo.findByEmail('nonexistent@test.com', testCompanyId)
			expect(tenant).toBeNull()
		})

		test('should find tenants by company id', async () => {
			const tenants = await tenantRepo.findByCompanyId(testCompanyId)

			expect(tenants).toBeDefined()
			expect(tenants.length).toBeGreaterThanOrEqual(1)
			expect(tenants.every((t) => t.companyId === testCompanyId)).toBe(true)
		})
	})

	describe('List with Filters', () => {
		beforeAll(async () => {
			// Create additional tenants for filter testing
			await tenantRepo.create({
				name: 'Maria Silva',
				email: `maria-${testRunId}@test.com`,
				phone: '11777777777',
				cpf: '11111111111',
				companyId: testCompanyId,
				createdBy: testOwnerId,
			})

			await tenantRepo.create({
				name: 'João Santos',
				email: `joao-${testRunId}@test.com`,
				phone: '11666666666',
				cpf: '22222222222',
				companyId: testCompanyId,
				createdBy: testBrokerId,
			})
		})

		test('should list tenants with basic filters', async () => {
			const result = await tenantRepo.list({
				companyId: testCompanyId,
				limit: 10,
				offset: 0,
			})

			expect(result.data).toBeDefined()
			expect(result.total).toBeGreaterThanOrEqual(3)
			expect(result.limit).toBe(10)
			expect(result.offset).toBe(0)
		})

		test('should list tenants filtered by createdBy', async () => {
			const result = await tenantRepo.list({
				companyId: testCompanyId,
				createdBy: testBrokerId,
			})

			expect(result.data.every((t) => t.createdBy === testBrokerId)).toBe(true)
		})

		test('should list tenants with search by name', async () => {
			const result = await tenantRepo.list({
				companyId: testCompanyId,
				search: 'Maria',
			})

			expect(result.data.length).toBeGreaterThanOrEqual(1)
			expect(result.data.some((t) => t.name.includes('Maria'))).toBe(true)
		})

		test('should list tenants with search by email', async () => {
			const result = await tenantRepo.list({
				companyId: testCompanyId,
				search: 'joao',
			})

			expect(result.data.length).toBeGreaterThanOrEqual(1)
		})

		test('should list tenants with search by cpf', async () => {
			const result = await tenantRepo.list({
				companyId: testCompanyId,
				search: '11111111111',
			})

			expect(result.data.length).toBeGreaterThanOrEqual(1)
			expect(result.data.some((t) => t.cpf === '11111111111')).toBe(true)
		})

		test('should paginate results', async () => {
			const result = await tenantRepo.list({
				companyId: testCompanyId,
				limit: 1,
				offset: 0,
			})

			expect(result.data.length).toBe(1)
			expect(result.total).toBeGreaterThan(1)
		})

		test('should handle offset pagination', async () => {
			const firstPage = await tenantRepo.list({
				companyId: testCompanyId,
				limit: 1,
				offset: 0,
			})

			const secondPage = await tenantRepo.list({
				companyId: testCompanyId,
				limit: 1,
				offset: 1,
			})

			expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id)
		})
	})

	describe('Count Operations', () => {
		test('should count tenants by company id', async () => {
			const count = await tenantRepo.countByCompanyId(testCompanyId)
			expect(count).toBeGreaterThanOrEqual(3)
		})

		test('should return 0 for non-existent company', async () => {
			const count = await tenantRepo.countByCompanyId('00000000-0000-0000-0000-000000000000')
			expect(count).toBe(0)
		})
	})

	describe('Delete Operations', () => {
		test('should delete tenant', async () => {
			const tenant = await tenantRepo.create({
				name: 'Tenant to Delete',
				email: `delete-${testRunId}@test.com`,
				phone: '11555555555',
				cpf: '33333333333',
				companyId: testCompanyId,
				createdBy: testOwnerId,
			})

			const deleted = await tenantRepo.delete(tenant.id)
			expect(deleted).toBe(true)

			const found = await tenantRepo.findById(tenant.id)
			expect(found).toBeNull()
		})

		test('should return false when deleting non-existent tenant', async () => {
			const deleted = await tenantRepo.delete('00000000-0000-0000-0000-000000000000')
			expect(deleted).toBe(false)
		})
	})
})
