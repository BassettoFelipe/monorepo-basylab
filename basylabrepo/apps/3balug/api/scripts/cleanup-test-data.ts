import postgres from 'postgres'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const sql = postgres(DATABASE_URL)

async function cleanup() {
	try {
		console.log('🧹 Limpando dados de teste...\n')

		// First, get all test companies and their owners
		const testCompanies = await sql`
			SELECT c.id, c.name, c.owner_id
			FROM companies c
			JOIN users u ON c.owner_id = u.id
			WHERE u.email LIKE '%@test.com'
		`

		console.log(`📋 Encontradas ${testCompanies.length} empresas de teste`)

		// Delete in correct order: employees -> companies -> owners
		for (const company of testCompanies) {
			// 1. Delete employees (users that are not the owner)
			const deletedEmployees = await sql`
				DELETE FROM users
				WHERE company_id = ${company.id} AND id != ${company.owner_id}
				RETURNING email
			`
			console.log(
				`   🔸 Empresa "${company.name}": ${deletedEmployees.length} funcionários deletados`,
			)

			// 2. Delete the company
			await sql`DELETE FROM companies WHERE id = ${company.id}`
			console.log(`   🔸 Empresa "${company.name}" deletada`)

			// 3. Delete the owner
			await sql`DELETE FROM users WHERE id = ${company.owner_id}`
			console.log(`   🔸 Owner deletado`)
		}

		// Delete any remaining orphan test users
		const orphanUsers = await sql`
			DELETE FROM users WHERE email LIKE '%@test.com'
			RETURNING email
		`

		if (orphanUsers.length > 0) {
			console.log(`\n🗑️  ${orphanUsers.length} usuários órfãos deletados`)
		}

		console.log('\n✨ Limpeza concluída!')
	} catch (error) {
		console.error('❌ Erro:', error)
	} finally {
		await sql.end()
	}
}

cleanup()
