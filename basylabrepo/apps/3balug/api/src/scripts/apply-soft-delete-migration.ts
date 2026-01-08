import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function migrate() {
	try {
		console.log('Starting migration...')

		// Add deleted_at column if it doesn't exist
		await sql.unsafe('ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at timestamp')
		console.log('✓ Added deleted_at column')

		// Add deleted_by column if it doesn't exist
		await sql.unsafe('ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by uuid')
		console.log('✓ Added deleted_by column')

		// Add foreign key constraint (may fail if already exists)
		try {
			await sql.unsafe(
				'ALTER TABLE documents ADD CONSTRAINT documents_deleted_by_users_id_fk FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL',
			)
			console.log('✓ Added foreign key constraint')
		} catch (e: unknown) {
			const error = e as Error
			if (error.message.includes('already exists')) {
				console.log('✓ Foreign key constraint already exists')
			} else {
				console.log('⚠ Foreign key constraint:', error.message)
			}
		}

		// Add index (may fail if already exists)
		await sql.unsafe(
			'CREATE INDEX IF NOT EXISTS documents_deleted_at_idx ON documents USING btree (deleted_at)',
		)
		console.log('✓ Added index')

		console.log('\n✅ Migration completed successfully!')
	} catch (error: unknown) {
		const err = error as Error
		console.error('❌ Migration failed:', err.message)
		process.exit(1)
	} finally {
		await sql.end()
	}
}

migrate()
