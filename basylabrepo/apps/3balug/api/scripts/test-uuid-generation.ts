import postgres from 'postgres'

const TEST_DATABASE_URL = 'postgresql://crm_imobil:crm_imobil123@localhost:5435/crm_imobil_test'

const sql = postgres(TEST_DATABASE_URL)

async function testUUIDGeneration() {
	console.log('🧪 Testando geração de UUID no banco de teste...\n')

	try {
		// Test 1: Check table structure
		console.log('1️⃣ Verificando estrutura da tabela users:')
		const tableInfo = await sql`
      SELECT column_name, column_default, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'id'
    `
		console.log(tableInfo)
		console.log()

		// Test 2: Insert a test user and see what ID is generated
		console.log('2️⃣ Inserindo usuário de teste:')
		const result = await sql`
      INSERT INTO users (email, password, name)
      VALUES ('test-uuid@example.com', 'password123', 'Test User')
      RETURNING id
    `
		console.log('ID gerado:', result[0].id)
		console.log('Tipo do ID:', typeof result[0].id)
		console.log()

		// Test 3: Clean up
		console.log('3️⃣ Limpando teste:')
		await sql`DELETE FROM users WHERE email = 'test-uuid@example.com'`
		console.log('✅ Teste limpo!')

		console.log('\n🎉 Teste concluído com sucesso!')
	} catch (error) {
		console.error('❌ Erro:', error)
		process.exit(1)
	} finally {
		await sql.end()
	}
}

testUUIDGeneration()
