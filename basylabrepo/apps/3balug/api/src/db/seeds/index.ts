import { seedE2ETestUser } from './e2e-test-user.seed'
import { seedFeatures } from './features.seed'
import { seedPlans } from './plans.seed'

async function runSeeds() {
	try {
		await seedPlans()
		await seedFeatures()
		// Criar usuário de teste E2E apenas em ambiente de desenvolvimento/teste
		if (process.env.NODE_ENV !== 'production') {
			await seedE2ETestUser()
		}
		process.exit(0)
	} catch (_error) {
		console.error('Erro ao executar seeds:', _error)
		process.exit(1)
	}
}

runSeeds()
