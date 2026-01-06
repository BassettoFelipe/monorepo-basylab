import { CreateFeatureUseCase } from '@/use-cases/features/create-feature/create-feature.use-case'
import { DeleteFeatureUseCase } from '@/use-cases/features/delete-feature/delete-feature.use-case'
import { GetFeatureUseCase } from '@/use-cases/features/get-feature/get-feature.use-case'
import { ListFeaturesUseCase } from '@/use-cases/features/list-features/list-features.use-case'
import { UpdateFeatureUseCase } from '@/use-cases/features/update-feature/update-feature.use-case'
import { repositories } from './repositories'

export function createFeatureUseCases() {
	return {
		create: new CreateFeatureUseCase(repositories.featureRepository),
		list: new ListFeaturesUseCase(repositories.featureRepository),
		get: new GetFeatureUseCase(repositories.featureRepository),
		update: new UpdateFeatureUseCase(repositories.featureRepository),
		delete: new DeleteFeatureUseCase(repositories.featureRepository),
	}
}
