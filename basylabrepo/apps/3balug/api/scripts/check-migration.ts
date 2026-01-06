import postgres from 'postgres'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const sql = postgres(DATABASE_URL)

async function checkMigration() {
	try {
		console.log('🔍 Verificando estrutura do banco...\n')

		// Check companies table
		const companies = await sql`SELECT * FROM companies`
		console.log('📊 Companies:', companies.length, 'registros')
		if (companies.length > 0) {
			console.log('   Exemplo:', companies[0])
		}

		// Check users table structure
		const users = await sql`
			SELECT id, email, name, role, company_id, is_active
			FROM users
			LIMIT 5
		`
		console.log('\n👥 Users:', users.length, 'registros (primeiros 5)')
		users.forEach((user, i) => {
			console.log(`   ${i + 1}. ${user.name} - ${user.email}`)
			console.log(
				`      Role: ${user.role}, Company: ${user.company_id}, Active: ${user.is_active}`,
			)
		})

		console.log('\n✅ Verificação concluída!')
	} catch (error) {
		console.error('❌ Erro:', error)
	} finally {
		await sql.end()
	}
}

checkMigration()
