/**
 * Setup de autenticação para testes E2E
 *
 * Este arquivo configura a autenticação uma vez e salva o estado
 * para reutilizar em todos os testes, evitando login repetido.
 */

import { expect, test as setup } from '@playwright/test'

// Credenciais do usuário de teste E2E (deve corresponder ao seed e2e-test-user.seed.ts)
const E2E_TEST_USER = {
	email: 'e2e-test@3balug.com',
	password: 'E2eTest@123456',
}

const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
	// Navegar para página de login
	await page.goto('/login')
	await page.waitForLoadState('networkidle')

	// Verificar se já está autenticado (redirecionou)
	const currentUrl = page.url()
	if (currentUrl.includes('/dashboard') || currentUrl.includes('/property-owners')) {
		// Já está logado, salvar estado
		await page.context().storageState({ path: authFile })
		return
	}

	// Preencher formulário de login
	const emailInput = page.locator('input[type="email"], input[name="email"]')
	const passwordInput = page.locator('input[type="password"], input[name="password"]')

	await expect(emailInput).toBeVisible({ timeout: 10000 })

	await emailInput.fill(E2E_TEST_USER.email)
	await passwordInput.fill(E2E_TEST_USER.password)

	// Submeter
	const submitButton = page.locator('button[type="submit"]')
	await submitButton.click()

	// Aguardar redirecionamento para área logada
	await page.waitForURL(/\/(dashboard|property-owners|properties)/, { timeout: 30000 })

	// Verificar que o login foi bem sucedido
	await expect(page).not.toHaveURL(/\/login/)

	// Salvar estado de autenticação
	await page.context().storageState({ path: authFile })
})
