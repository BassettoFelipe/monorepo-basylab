import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil'

const sql = postgres(DATABASE_URL)

async function runMigration() {
	const migrationFile = process.argv[2]

	if (!migrationFile) {
		console.error('❌ Erro: Forneça o nome do arquivo de migration')
		console.error('Uso: bun run scripts/run-migration.ts <arquivo.sql>')
		process.exit(1)
	}

	try {
		const migrationPath = join(process.cwd(), 'drizzle', migrationFile)
		const migrationSQL = readFileSync(migrationPath, 'utf-8')

		console.log(`🚀 Executando migration: ${migrationFile}`)
		console.log('📄 Conteúdo:')
		console.log(migrationSQL)
		console.log('\n⏳ Aplicando...\n')

		await sql.unsafe(migrationSQL)

		console.log('✅ Migration executada com sucesso!')
	} catch (error) {
		console.error('❌ Erro ao executar migration:', error)
		process.exit(1)
	} finally {
		await sql.end()
	}
}

runMigration()
