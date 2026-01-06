import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: './src/db/schema/index.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url:
			process.env.DATABASE_URL || 'postgresql://crm_imobil:crm_imobil123@localhost:5432/crm_imobil',
	},
	verbose: true,
	strict: true,
})
