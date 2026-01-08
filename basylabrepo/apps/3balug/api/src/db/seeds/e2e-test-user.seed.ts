/**
 * Seed para criar usuário de teste E2E
 *
 * Este script cria um usuário com subscription ativa para ser usado
 * nos testes E2E do frontend (Playwright)
 *
 * Credenciais:
 * - Email: e2e-test@3balug.com
 * - Senha: E2eTest@123456
 */

import { PasswordUtils } from '@basylab/core/crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { companies, plans, subscriptions, users } from '@/db/schema'

// Credenciais do usuário de teste E2E
export const E2E_TEST_USER = {
	email: 'e2e-test@3balug.com',
	password: 'E2eTest@123456',
	name: 'Usuario Teste E2E',
}

export async function seedE2ETestUser() {
	console.log('Criando usuário de teste E2E...')

	// Verificar se já existe
	const existingUser = await db.query.users.findFirst({
		where: eq(users.email, E2E_TEST_USER.email),
	})

	if (existingUser) {
		console.log('Usuário de teste E2E já existe, pulando criação')
		return existingUser
	}

	// Buscar plano básico
	const basicPlan = await db.query.plans.findFirst({
		where: eq(plans.slug, 'basico'),
	})

	if (!basicPlan) {
		throw new Error('Plano básico não encontrado. Execute db:seed primeiro.')
	}

	// Criar hash da senha
	const hashedPassword = await PasswordUtils.hash(E2E_TEST_USER.password)

	// Criar empresa
	const [company] = await db
		.insert(companies)
		.values({
			name: 'Empresa Teste E2E',
			cnpj: '00000000000191', // CNPJ válido para testes
			email: E2E_TEST_USER.email,
			phone: '11999999999',
		})
		.returning()

	// Criar usuário verificado
	const [user] = await db
		.insert(users)
		.values({
			email: E2E_TEST_USER.email,
			password: hashedPassword,
			name: E2E_TEST_USER.name,
			role: 'owner',
			companyId: company.id,
			isEmailVerified: true,
			isActive: true,
		})
		.returning()

	// Atualizar empresa com ownerId
	await db.update(companies).set({ ownerId: user.id }).where(eq(companies.id, company.id))

	// Criar subscription ativa
	const startDate = new Date()
	const endDate = new Date()
	endDate.setFullYear(endDate.getFullYear() + 1) // 1 ano

	await db.insert(subscriptions).values({
		userId: user.id,
		planId: basicPlan.id,
		status: 'active',
		startDate,
		endDate,
	})

	console.log('Usuário de teste E2E criado com sucesso!')
	console.log(`Email: ${E2E_TEST_USER.email}`)
	console.log(`Senha: ${E2E_TEST_USER.password}`)

	return user
}

// Executar se chamado diretamente
if (import.meta.main) {
	seedE2ETestUser()
		.then(() => {
			console.log('Seed E2E concluído!')
			process.exit(0)
		})
		.catch((error) => {
			console.error('Erro ao executar seed E2E:', error)
			process.exit(1)
		})
}
