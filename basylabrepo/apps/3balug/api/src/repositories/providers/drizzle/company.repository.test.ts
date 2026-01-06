import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'
import { USER_ROLES } from '@/types/roles'
import { CompanyDrizzleRepository } from './company.repository'
import { UserDrizzleRepository } from './user.repository'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const connection = postgres(DATABASE_URL)
const db = drizzle(connection, { schema })

describe('CompanyDrizzleRepository', () => {
	const companyRepo = new CompanyDrizzleRepository(db)
	const userRepo = new UserDrizzleRepository(db)

	let testOwnerId: string
	let testCompanyId: string

	beforeAll(async () => {
		await connection`DELETE FROM users WHERE email LIKE '%company-repo-test@test.com'`

		const hashedPassword = await PasswordUtils.hash('Test@123')
		const owner = await userRepo.create({
			email: 'company-repo-test@test.com',
			password: hashedPassword,
			name: 'Test Owner',
			role: USER_ROLES.OWNER,
			isActive: true,
		})
		testOwnerId = owner.id
	})

	afterAll(async () => {
		await connection`DELETE FROM companies WHERE owner_id = ${testOwnerId}`
		await connection`DELETE FROM users WHERE id = ${testOwnerId}`
		await connection.end()
	})

	test('should create a company', async () => {
		const company = await companyRepo.create({
			name: 'Test Company',
			ownerId: testOwnerId,
			email: 'test-company@test.com',
		})

		expect(company).toBeDefined()
		expect(company.id).toBeDefined()
		expect(company.name).toBe('Test Company')
		expect(company.ownerId).toBe(testOwnerId)
		expect(company.email).toBe('test-company@test.com')

		testCompanyId = company.id
	})

	test('should find company by id', async () => {
		const company = await companyRepo.findById(testCompanyId)

		expect(company).toBeDefined()
		expect(company?.id).toBe(testCompanyId)
		expect(company?.name).toBe('Test Company')
	})

	test('should find company by owner id', async () => {
		const company = await companyRepo.findByOwnerId(testOwnerId)

		expect(company).toBeDefined()
		expect(company?.ownerId).toBe(testOwnerId)
	})

	test('should return null for non-existent company', async () => {
		const company = await companyRepo.findById('00000000-0000-0000-0000-000000000000')

		expect(company).toBeNull()
	})

	test('should create company with CNPJ', async () => {
		const company = await companyRepo.create({
			name: 'Company with CNPJ',
			cnpj: '12.345.678/0001-90',
			ownerId: testOwnerId,
		})

		expect(company.cnpj).toBe('12.345.678/0001-90')

		const found = await companyRepo.findByCnpj('12.345.678/0001-90')
		expect(found).toBeDefined()
		expect(found?.id).toBe(company.id)

		await companyRepo.delete(company.id)
	})

	test('should update company', async () => {
		const updated = await companyRepo.update(testCompanyId, {
			name: 'Updated Company Name',
			phone: '11999999999',
		})

		expect(updated).toBeDefined()
		expect(updated?.name).toBe('Updated Company Name')
		expect(updated?.phone).toBe('11999999999')
	})

	test('should list companies by owner', async () => {
		const company2 = await companyRepo.create({
			name: 'Second Company',
			ownerId: testOwnerId,
		})

		const companies = await companyRepo.listByOwner(testOwnerId)

		expect(companies.length).toBeGreaterThanOrEqual(2)
		expect(companies.some((c) => c.id === testCompanyId)).toBe(true)
		expect(companies.some((c) => c.id === company2.id)).toBe(true)

		await companyRepo.delete(company2.id)
	})

	test('should delete company', async () => {
		const company = await companyRepo.create({
			name: 'Company to Delete',
			ownerId: testOwnerId,
		})

		const deleted = await companyRepo.delete(company.id)
		expect(deleted).toBe(true)

		const found = await companyRepo.findById(company.id)
		expect(found).toBeNull()
	})

	test('should return false when deleting non-existent company', async () => {
		const deleted = await companyRepo.delete('00000000-0000-0000-0000-000000000000')
		expect(deleted).toBe(false)
	})
})
