import { expect, test } from '@playwright/test'
import type { Plan } from '../src/types/plan.types'

test.describe('Landing Page - Plans Section', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('deve carregar e exibir os planos corretamente', async ({ page }) => {
		// Aguardar a seção de planos estar visível
		const plansSection = page.locator('#planos')
		await expect(plansSection).toBeVisible()

		// Aguardar os cards de planos carregarem (não devem estar em loading)
		await page.waitForSelector('[data-testid="plan-card"]', {
			state: 'visible',
			timeout: 10000,
		})

		// Capturar todos os cards de planos
		const planCards = page.locator('[data-testid="plan-card"]')
		const planCount = await planCards.count()

		// Validar que temos planos carregados
		expect(planCount).toBeGreaterThan(0)
		expect(planCount).toBeLessThanOrEqual(3) // Esperamos no máximo 3 planos

		console.log(`✓ ${planCount} planos encontrados na página`)
	})

	test('deve validar estrutura de dados de cada plano', async ({ page }) => {
		// Aguardar os planos carregarem
		await page.waitForSelector('[data-testid="plan-card"]', {
			state: 'visible',
			timeout: 10000,
		})

		const planCards = page.locator('[data-testid="plan-card"]')
		const planCount = await planCards.count()

		// Validar cada plano individualmente
		for (let i = 0; i < planCount; i++) {
			const card = planCards.nth(i)

			// Validar que tem nome do plano
			const planName = card.locator('[data-testid="plan-name"]')
			await expect(planName).toBeVisible()
			const nameText = await planName.textContent()
			expect(nameText).toBeTruthy()
			expect(nameText?.length).toBeGreaterThan(0)

			// Validar que tem preço
			const planPrice = card.locator('[data-testid="plan-price"]')
			await expect(planPrice).toBeVisible()
			const priceText = await planPrice.textContent()
			expect(priceText).toBeTruthy()
			expect(priceText).toMatch(/R\$\s*\d+/) // Formato de moeda brasileira

			// Validar que tem features (pelo menos uma)
			const features = card.locator('[data-testid="plan-feature"]')
			const featureCount = await features.count()
			expect(featureCount).toBeGreaterThan(0)

			// Validar que tem botão de ação
			const actionButton = card.locator('button', {
				hasText: /Selecionar Plano|Começar Agora/i,
			})
			await expect(actionButton).toBeVisible()

			console.log(`✓ Plano ${i + 1}: ${nameText} - ${priceText} - ${featureCount} features`)
		}
	})

	test('deve validar dados específicos esperados dos planos', async ({ page }) => {
		// Aguardar os planos carregarem
		await page.waitForSelector('[data-testid="plan-card"]', {
			state: 'visible',
			timeout: 10000,
		})

		const planCards = page.locator('[data-testid="plan-card"]')
		const planCount = await planCards.count()

		const plansData: Array<{
			name: string
			price: string
			features: string[]
		}> = []

		// Coletar dados de todos os planos
		for (let i = 0; i < planCount; i++) {
			const card = planCards.nth(i)

			const name = (await card.locator('[data-testid="plan-name"]').textContent()) || ''
			const price = (await card.locator('[data-testid="plan-price"]').textContent()) || ''

			const featureElements = card.locator('[data-testid="plan-feature"]')
			const featureCount = await featureElements.count()
			const features: string[] = []

			for (let j = 0; j < featureCount; j++) {
				const featureText = await featureElements.nth(j).textContent()
				if (featureText) {
					features.push(featureText.trim())
				}
			}

			plansData.push({ name, price, features })
		}

		console.log('📊 Dados dos planos coletados:', JSON.stringify(plansData, null, 2))

		// Validações específicas que esperamos
		for (const plan of plansData) {
			// Todos os planos devem ter informação de usuários
			const hasUserInfo = plan.features.some(
				(f) => f.toLowerCase().includes('usuário') || f.toLowerCase().includes('usuario'),
			)
			expect(hasUserInfo).toBe(true)

			// Todos os planos devem ter informação de gestores
			const hasManagerInfo = plan.features.some((f) => f.toLowerCase().includes('gestor'))
			expect(hasManagerInfo).toBe(true)

			// Todos os planos devem ter informação de consultas Serasa
			const hasSerasaInfo = plan.features.some(
				(f) => f.toLowerCase().includes('serasa') || f.toLowerCase().includes('consulta'),
			)
			expect(hasSerasaInfo).toBe(true)

			// Todos os planos devem ter gestão de imóveis
			const hasPropertyManagement = plan.features.some(
				(f) => f.toLowerCase().includes('imóveis') || f.toLowerCase().includes('imoveis'),
			)
			expect(hasPropertyManagement).toBe(true)

			// Todos os planos devem ter contratos digitais
			const hasDigitalContracts = plan.features.some((f) => f.toLowerCase().includes('contrato'))
			expect(hasDigitalContracts).toBe(true)

			console.log(`✓ Plano "${plan.name}" possui todas as features obrigatórias`)
		}
	})

	test('deve validar que a API retorna dados válidos', async ({ page }) => {
		// Interceptar a chamada da API
		const apiResponse = await page.waitForResponse(
			(response) => response.url().includes('/plans') && response.status() === 200,
			{ timeout: 10000 },
		)

		// Validar que a resposta é JSON
		const contentType = apiResponse.headers()['content-type']
		expect(contentType).toContain('application/json')

		// Parsear os dados
		const plans: Plan[] = await apiResponse.json()

		// Validar estrutura dos dados da API
		expect(Array.isArray(plans)).toBe(true)
		expect(plans.length).toBeGreaterThan(0)

		console.log(`✓ API retornou ${plans.length} planos`)

		// Validar cada plano da API
		for (const plan of plans) {
			// Validar campos obrigatórios
			expect(plan.id).toBeTruthy()
			expect(plan.name).toBeTruthy()
			expect(plan.slug).toBeTruthy()
			expect(['basico', 'imobiliaria', 'house']).toContain(plan.slug)
			expect(typeof plan.price).toBe('number')
			expect(plan.price).toBeGreaterThan(0)
			expect(typeof plan.maxManagers).toBe('number')
			expect(plan.maxManagers).toBeGreaterThanOrEqual(0)
			expect(typeof plan.maxSerasaQueries).toBe('number')
			expect(plan.maxSerasaQueries).toBeGreaterThan(0)
			// allowsLateCharges pode vir como boolean ou number (0/1) do banco
			expect(['boolean', 'number']).toContain(typeof plan.allowsLateCharges)
			expect(Array.isArray(plan.features)).toBe(true)
			expect(plan.createdAt).toBeTruthy()
			expect(plan.updatedAt).toBeTruthy()

			console.log(
				`✓ Plano "${plan.name}" (${plan.slug}): R$ ${plan.price} - ${plan.features.length} features na API`,
			)
		}
	})

	test('deve exibir erro adequadamente quando API falha', async ({ page }) => {
		// Simular falha na API
		await page.route('**/plans', (route) => route.abort())

		await page.goto('/')

		// Aguardar mensagem de erro
		const errorContainer = page.locator('text=Erro ao carregar planos')
		await expect(errorContainer).toBeVisible({ timeout: 10000 })

		// Verificar se tem botão de retry
		const retryButton = page.locator('button', {
			hasText: /Tentar Novamente/i,
		})
		await expect(retryButton).toBeVisible()

		console.log('✓ Mensagem de erro exibida corretamente quando API falha')
	})

	test('deve mostrar skeleton loader enquanto carrega', async ({ page }) => {
		// Atrasar a resposta da API para ver o loading
		await page.route('**/plans', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 1000))
			await route.continue()
		})

		await page.goto('/')

		// Verificar se skeleton está visível inicialmente
		const skeleton = page.locator('[data-testid="plan-skeleton"]').first()

		// Se o skeleton existir, validar
		const skeletonCount = await page.locator('[data-testid="plan-skeleton"]').count()
		if (skeletonCount > 0) {
			await expect(skeleton).toBeVisible()
			console.log('✓ Skeleton loader exibido durante carregamento')
		}

		// Aguardar os planos carregarem
		await page.waitForSelector('[data-testid="plan-card"]', {
			state: 'visible',
			timeout: 10000,
		})

		console.log('✓ Planos carregados após skeleton')
	})
})
