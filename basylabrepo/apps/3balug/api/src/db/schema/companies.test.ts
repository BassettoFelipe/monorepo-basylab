import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { PasswordUtils } from '@basylab/core/crypto'
import postgres from 'postgres'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const sql = postgres(DATABASE_URL)

// Generate unique email for this test run to avoid conflicts
const testRunId = Date.now()
const testEmail = `test-companies-${testRunId}@test.com`

describe('Companies Schema', () => {
	let testUserId: string | null = null

	beforeAll(async () => {
		// Clean up any leftover test data from previous runs
		await sql`DELETE FROM companies WHERE name LIKE 'Test%' OR name LIKE 'Company%' OR name LIKE 'Full%' OR name LIKE 'Protected%' OR name LIKE 'Settings%' OR name LIKE 'Orphan%'`
		await sql`DELETE FROM users WHERE email LIKE 'test-companies-%@test.com' OR email LIKE 'owner-test-%@test.com' OR email LIKE 'multi-company-owner-%@test.com'`

		// Create a test user for FK constraints
		const hashedPassword = await PasswordUtils.hash('Test@123')
		const [user] = await sql`
			INSERT INTO users (email, password, name, role, is_active)
			VALUES (${testEmail}, ${hashedPassword}, 'Test User', 'owner', true)
			RETURNING id
		`
		testUserId = user.id
	})

	afterAll(async () => {
		// Cleanup test data
		if (testUserId) {
			await sql`DELETE FROM companies WHERE owner_id = ${testUserId}`
			await sql`DELETE FROM users WHERE id = ${testUserId}`
		}
		// Also cleanup any test emails that might have been created
		await sql`DELETE FROM users WHERE email LIKE 'owner-test-%@test.com' OR email LIKE 'multi-company-owner-%@test.com'`
		await sql.end()
	})

	test('should create company with required fields', async () => {
		const [company] = await sql`
			INSERT INTO companies (name, owner_id)
			VALUES ('Test Company', ${testUserId})
			RETURNING *
		`

		expect(company).toBeDefined()
		expect(company.id).toBeDefined()
		expect(company.name).toBe('Test Company')
		expect(company.owner_id).toBe(testUserId)
		expect(company.settings).toEqual({})
		expect(company.created_at).toBeDefined()
		expect(company.updated_at).toBeDefined()
	})

	test('should create company with all fields', async () => {
		const [company] = await sql`
			INSERT INTO companies (
				name, cnpj, owner_id, email, phone, address, city, state, zip_code,
				settings
			)
			VALUES (
				'Full Company',
				'12.345.678/0001-90',
				${testUserId},
				'company@test.com',
				'11999999999',
				'Rua Teste, 123',
				'São Paulo',
				'SP',
				'01234-567',
				'{"logo": "logo.png", "primaryColor": "#000000"}'::jsonb
			)
			RETURNING *
		`

		expect(company).toBeDefined()
		expect(company.cnpj).toBe('12.345.678/0001-90')
		expect(company.email).toBe('company@test.com')
		expect(company.phone).toBe('11999999999')
		expect(company.address).toBe('Rua Teste, 123')
		expect(company.city).toBe('São Paulo')
		expect(company.state).toBe('SP')
		expect(company.zip_code).toBe('01234-567')
		expect(company.settings).toEqual({
			logo: 'logo.png',
			primaryColor: '#000000',
		})

		await sql`DELETE FROM companies WHERE id = ${company.id}`
	})

	test('should enforce unique CNPJ constraint', async () => {
		const cnpj = '11.111.111/0001-11'

		await sql`
			INSERT INTO companies (name, cnpj, owner_id)
			VALUES ('Company 1', ${cnpj}, ${testUserId})
		`

		try {
			await sql`
				INSERT INTO companies (name, cnpj, owner_id)
				VALUES ('Company 2', ${cnpj}, ${testUserId})
			`
			expect(true).toBe(false) // Should not reach here
		} catch (error: unknown) {
			const pgError = error as { code?: string }
			expect(pgError.code).toBe('23505') // unique_violation
		}

		await sql`DELETE FROM companies WHERE cnpj = ${cnpj}`
	})

	test('should allow NULL CNPJ for multiple companies', async () => {
		const [company1] = await sql`
			INSERT INTO companies (name, owner_id)
			VALUES ('Company No CNPJ 1', ${testUserId})
			RETURNING id
		`

		const [company2] = await sql`
			INSERT INTO companies (name, owner_id)
			VALUES ('Company No CNPJ 2', ${testUserId})
			RETURNING id
		`

		expect(company1.id).toBeDefined()
		expect(company2.id).toBeDefined()

		await sql`DELETE FROM companies WHERE id IN (${company1.id}, ${company2.id})`
	})

	test('should enforce NOT NULL constraint on required fields', async () => {
		try {
			await sql`
				INSERT INTO companies (cnpj, owner_id)
				VALUES ('12.345.678/0001-90', ${testUserId})
			`
			expect(true).toBe(false) // Should not reach here
		} catch (error: unknown) {
			const pgError = error as { code?: string }
			expect(pgError.code).toBe('23502') // not_null_violation
		}
	})

	test('should enforce foreign key constraint to users', async () => {
		const fakeUserId = '00000000-0000-0000-0000-000000000000'

		try {
			await sql`
				INSERT INTO companies (name, owner_id)
				VALUES ('Orphan Company', ${fakeUserId})
			`
			expect(true).toBe(false) // Should not reach here
		} catch (error: unknown) {
			const pgError = error as { code?: string }
			expect(pgError.code).toBe('23503') // foreign_key_violation
		}
	})

	test('should prevent deletion of user if they own a company (restrict)', async () => {
		const hashedPassword = await PasswordUtils.hash('Test@123')
		const ownerTestEmail = `owner-test-${testRunId}@test.com`
		const [newUser] = await sql`
			INSERT INTO users (email, password, name, role)
			VALUES (${ownerTestEmail}, ${hashedPassword}, 'Owner Test', 'owner')
			RETURNING id
		`

		const [company] = await sql`
			INSERT INTO companies (name, owner_id)
			VALUES ('Protected Company', ${newUser.id})
			RETURNING id
		`

		try {
			await sql`DELETE FROM users WHERE id = ${newUser.id}`
			expect(true).toBe(false) // Should not reach here
		} catch (error: unknown) {
			const pgError = error as { code?: string }
			expect(pgError.code).toBe('23503') // foreign_key_violation
		}

		// Cleanup
		await sql`DELETE FROM companies WHERE id = ${company.id}`
		await sql`DELETE FROM users WHERE id = ${newUser.id}`
	})

	test('should update company settings', async () => {
		const [company] = await sql`
			INSERT INTO companies (name, owner_id)
			VALUES ('Settings Test Company', ${testUserId})
			RETURNING id
		`

		const newSettings = {
			logo: 'new-logo.png',
			primaryColor: '#FF0000',
			timezone: 'America/Sao_Paulo',
			locale: 'pt-BR',
			notifications: {
				email: true,
				sms: false,
				whatsapp: true,
			},
		}

		await sql`
			UPDATE companies
			SET settings = ${JSON.stringify(newSettings)}::jsonb,
			    updated_at = NOW()
			WHERE id = ${company.id}
		`

		const [updated] = await sql`
			SELECT * FROM companies WHERE id = ${company.id}
		`

		// postgres-js may return jsonb as string, so we need to parse it
		const settings =
			typeof updated.settings === 'string' ? JSON.parse(updated.settings) : updated.settings

		expect(settings).toEqual(newSettings)
		expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(
			new Date(updated.created_at).getTime(),
		)

		await sql`DELETE FROM companies WHERE id = ${company.id}`
	})

	test('should query companies by owner', async () => {
		const hashedPassword = await PasswordUtils.hash('Test@123')
		const multiOwnerEmail = `multi-company-owner-${testRunId}@test.com`
		const [owner] = await sql`
			INSERT INTO users (email, password, name, role)
			VALUES (${multiOwnerEmail}, ${hashedPassword}, 'Multi Owner', 'owner')
			RETURNING id
		`

		await sql`
			INSERT INTO companies (name, owner_id)
			VALUES
				('Company A', ${owner.id}),
				('Company B', ${owner.id}),
				('Company C', ${owner.id})
			RETURNING id
		`

		const ownedCompanies = await sql`
			SELECT * FROM companies WHERE owner_id = ${owner.id}
		`

		expect(ownedCompanies).toHaveLength(3)

		// Cleanup
		await sql`DELETE FROM companies WHERE owner_id = ${owner.id}`
		await sql`DELETE FROM users WHERE id = ${owner.id}`
	})
})
