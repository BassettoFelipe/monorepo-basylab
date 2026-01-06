import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

const TEST_DATABASE_URL = 'postgresql://crm_imobil:crm_imobil123@localhost:5435/crm_imobil_test'

const sql = postgres(TEST_DATABASE_URL)

async function setupTestDB() {
	console.log('🚀 Configurando banco de teste...\n')

	try {
		// Drop all tables first to ensure clean slate
		console.log('🗑️  Dropando tabelas existentes...')
		await sql.unsafe(`
      DROP TABLE IF EXISTS pending_payments CASCADE;
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS companies CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS plans CASCADE;
    `)
		console.log('✅ Tabelas antigas removidas!\n')

		console.log('📦 Criando schema atualizado...')

		// Create all tables from schema files
		const createTables = `
			-- Plans table
			CREATE TABLE IF NOT EXISTS "plans" (
				"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"name" text NOT NULL,
				"slug" text NOT NULL,
				"description" text,
				"price" integer NOT NULL,
				"duration_days" integer DEFAULT 30 NOT NULL,
				"max_users" integer,
				"max_managers" integer DEFAULT 0 NOT NULL,
				"max_serasa_queries" integer NOT NULL,
				"allows_late_charges" integer DEFAULT 0 NOT NULL,
				"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
				"pagarme_plan_id" text,
				"created_at" timestamp DEFAULT now() NOT NULL,
				"updated_at" timestamp DEFAULT now() NOT NULL,
				CONSTRAINT "plans_slug_unique" UNIQUE("slug")
			);

			-- Users table
			CREATE TABLE IF NOT EXISTS "users" (
				"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"email" text NOT NULL,
				"password" text NOT NULL,
				"name" text NOT NULL,
				"role" text DEFAULT 'owner' NOT NULL,
				"company_id" uuid,
				"is_active" boolean DEFAULT true NOT NULL,
				"is_email_verified" boolean DEFAULT false NOT NULL,
				"verification_secret" text,
				"verification_expires_at" timestamp,
				"verification_attempts" integer DEFAULT 0 NOT NULL,
				"verification_last_attempt_at" timestamp,
				"verification_resend_count" integer DEFAULT 0 NOT NULL,
				"verification_last_resend_at" timestamp,
				"password_reset_secret" text,
				"password_reset_expires_at" timestamp,
				"password_reset_resend_count" integer DEFAULT 0 NOT NULL,
				"password_reset_cooldown_ends_at" timestamp,
				"password_reset_resend_blocked" boolean DEFAULT false NOT NULL,
				"password_reset_resend_blocked_until" timestamp,
				"password_reset_attempts" integer DEFAULT 0 NOT NULL,
				"password_reset_last_attempt_at" timestamp,
				"created_at" timestamp DEFAULT now() NOT NULL,
				"updated_at" timestamp DEFAULT now() NOT NULL,
				CONSTRAINT "users_email_unique" UNIQUE("email")
			);

			-- Companies table
			CREATE TABLE IF NOT EXISTS "companies" (
				"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"name" text NOT NULL,
				"cnpj" text,
				"owner_id" uuid NOT NULL,
				"email" text,
				"phone" text,
				"address" text,
				"city" text,
				"state" text,
				"zip_code" text,
				"settings" jsonb DEFAULT '{}'::jsonb,
				"created_at" timestamp DEFAULT now() NOT NULL,
				"updated_at" timestamp DEFAULT now() NOT NULL,
				CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
			);

			-- Subscriptions table
			CREATE TABLE IF NOT EXISTS "subscriptions" (
				"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"user_id" uuid NOT NULL,
				"plan_id" uuid NOT NULL,
				"status" text DEFAULT 'active' NOT NULL,
				"start_date" timestamp DEFAULT now() NOT NULL,
				"end_date" timestamp,
				"created_at" timestamp DEFAULT now() NOT NULL,
				"updated_at" timestamp DEFAULT now() NOT NULL
			);

			-- Pending payments table
			CREATE TABLE IF NOT EXISTS "pending_payments" (
				"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
				"email" text NOT NULL,
				"password" text NOT NULL,
				"name" text NOT NULL,
				"plan_id" uuid NOT NULL,
				"pagarme_order_id" text,
				"pagarme_charge_id" text,
				"status" text DEFAULT 'pending' NOT NULL,
				"expires_at" timestamp NOT NULL,
				"created_at" timestamp DEFAULT now() NOT NULL,
				"updated_at" timestamp DEFAULT now() NOT NULL
			);

			-- Add foreign keys
			ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_owner_id_users_id_fk";
			ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_id_users_id_fk"
				FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE restrict;

			ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_company_id_companies_id_fk";
			ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk"
				FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade;

			ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_user_id_users_id_fk";
			ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk"
				FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

			ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_plan_id_plans_id_fk";
			ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk"
				FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE restrict;

			ALTER TABLE "pending_payments" DROP CONSTRAINT IF EXISTS "pending_payments_plan_id_plans_id_fk";
			ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_plan_id_plans_id_fk"
				FOREIGN KEY ("plan_id") REFERENCES "plans"("id");

			-- Create indexes
			CREATE INDEX IF NOT EXISTS "idx_users_company_id" ON "users"("company_id");
			CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
			CREATE INDEX IF NOT EXISTS "idx_users_is_active" ON "users"("is_active");
			CREATE INDEX IF NOT EXISTS "idx_companies_owner_id" ON "companies"("owner_id");
			CREATE INDEX IF NOT EXISTS "idx_companies_cnpj" ON "companies"("cnpj");
		`

		await sql.unsafe(createTables)
		console.log('✅ Schema criado com sucesso!\n')

		// Insert test plans
		console.log('📊 Inserindo planos de teste...')
		await sql`
			INSERT INTO plans (name, slug, description, price, duration_days, max_users, max_managers, max_serasa_queries, allows_late_charges, features)
			VALUES
				('Plano Básico', 'basico', 'Plano básico para corretores individuais', 9990, 30, 1, 0, 10, 0, '["Imóveis ilimitados", "Clientes ilimitados", "10 consultas Serasa/mês", "Boletos automáticos", "Contratos em PDF"]'::jsonb),
				('Plano Imobiliária', 'imobiliaria', 'Plano para pequenas e médias imobiliárias', 29990, 30, 10, 0, 10, 1, '["10 corretores", "Imóveis ilimitados", "10 consultas Serasa/mês", "Boletos + Juros", "Contratos em PDF"]'::jsonb),
				('Plano House', 'house', 'Plano para grandes redes imobiliárias', 99990, 30, NULL, 2, 30, 1, '["Corretores ilimitados", "2 gerentes", "30 consultas Serasa/mês", "Boletos + Juros", "Contratos em PDF"]'::jsonb)
			ON CONFLICT (slug) DO NOTHING
		`
		console.log('✅ Planos inseridos!\n')

		console.log('🎉 Banco de teste configurado com sucesso!')
	} catch (error) {
		console.error('❌ Erro:', error)
		process.exit(1)
	} finally {
		await sql.end()
	}
}

setupTestDB()
