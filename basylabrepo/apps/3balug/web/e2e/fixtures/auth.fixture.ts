import { type Page, test as base } from '@playwright/test'

/**
 * Fixture de autenticação para testes E2E
 *
 * Permite reutilizar sessão autenticada entre testes
 */

export interface AuthFixture {
	authenticatedPage: Page
}

// Credenciais de teste (devem ser configuradas via variáveis de ambiente)
const TEST_CREDENTIALS = {
	email: process.env.TEST_USER_EMAIL || 'test@example.com',
	password: process.env.TEST_USER_PASSWORD || 'Test@123456',
}

/**
 * Realiza login e retorna página autenticada
 */
async function performLogin(page: Page): Promise<void> {
	await page.goto('/login')
	await page.waitForLoadState('networkidle')

	// Verificar se já está logado
	const currentUrl = page.url()
	if (currentUrl.includes('/dashboard') || currentUrl.includes('/property-owners')) {
		return
	}

	// Preencher formulário de login
	const emailInput = page.locator('input[type="email"], input[name="email"]')
	const passwordInput = page.locator('input[type="password"], input[name="password"]')

	if ((await emailInput.count()) > 0) {
		await emailInput.fill(TEST_CREDENTIALS.email)
		await passwordInput.fill(TEST_CREDENTIALS.password)

		// Submeter
		const submitButton = page.locator('button[type="submit"]')
		await submitButton.click()

		// Aguardar redirecionamento
		await page.waitForURL(/\/(dashboard|property-owners|properties)/, {
			timeout: 15000,
		})
	}
}

/**
 * Fixture customizada com autenticação
 */
export const test = base.extend<AuthFixture>({
	authenticatedPage: async ({ page }, use) => {
		await performLogin(page)
		await use(page)
	},
})

export { expect } from '@playwright/test'
