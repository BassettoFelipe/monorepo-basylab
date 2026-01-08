import { seedFeatures } from './features.seed'
import { seedPlans } from './plans.seed'

async function runSeeds() {
	try {
		await seedPlans()
		await seedFeatures()
		process.exit(0)
	} catch (_error) {
		console.error('Erro ao executar seeds:', _error)
		process.exit(1)
	}
}

runSeeds()
