import { eq } from 'drizzle-orm'
import { db } from '../src/db/index'
import { users } from '../src/db/schema/users'

async function testDrizzleInsert() {
	console.log('🧪 Testando insert direto com Drizzle ORM...\n')

	try {
		console.log('NODE_ENV:', process.env.NODE_ENV)
		console.log(
			'DATABASE:',
			process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL,
		)
		console.log()

		// Insert user
		console.log('1️⃣ Inserindo usuário...')
		const result = await db
			.insert(users)
			.values({
				email: 'drizzle-test@example.com',
				password: 'pass123',
				name: 'Drizzle Test',
				role: 'owner',
				isActive: true,
			})
			.returning()

		console.log('Resultado completo:', result[0])
		console.log('ID gerado:', result[0].id)
		console.log('Tipo do ID:', typeof result[0].id)
		console.log(
			'Formato é UUID válido?',
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result[0].id),
		)
		console.log()

		// Clean up
		console.log('2️⃣ Limpando...')
		await db.delete(users).where(eq(users.email, 'drizzle-test@example.com'))
		console.log('✅ Limpo!')

		console.log('\n🎉 Teste concluído com sucesso!')
	} catch (error) {
		console.error('❌ Erro:', error)
		process.exit(1)
	} finally {
		process.exit(0)
	}
}

testDrizzleInsert()
