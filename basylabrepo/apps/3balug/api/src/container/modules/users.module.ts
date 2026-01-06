import { ActivateUserUseCase } from '@/use-cases/users/activate-user/activate-user.use-case'
import { CreateUserUseCase } from '@/use-cases/users/create-user/create-user.use-case'
import { DeactivateUserUseCase } from '@/use-cases/users/deactivate-user/deactivate-user.use-case'
import { DeleteUserUseCase } from '@/use-cases/users/delete-user/delete-user.use-case'
import { GetUserUseCase } from '@/use-cases/users/get-user/get-user.use-case'
import { ListUsersUseCase } from '@/use-cases/users/list-users/list-users.use-case'
import { UpdateUserUseCase } from '@/use-cases/users/update-user/update-user.use-case'
import { repositories } from './repositories'
import { services } from './services'

export function createUsersUseCases() {
	return {
		getUser: new GetUserUseCase(),
		createUser: new CreateUserUseCase(
			repositories.userRepository,
			repositories.companyRepository,
			repositories.subscriptionRepository,
			repositories.planRepository,
			repositories.customFieldRepository,
			repositories.customFieldResponseRepository,
			repositories.planFeatureRepository,
		),
		listUsers: new ListUsersUseCase(
			repositories.userRepository,
			repositories.customFieldRepository,
			repositories.customFieldResponseRepository,
		),
		updateUser: new UpdateUserUseCase(
			repositories.userRepository,
			repositories.subscriptionRepository,
			repositories.planRepository,
			services.userCacheService,
		),
		deactivateUser: new DeactivateUserUseCase(
			repositories.userRepository,
			services.userCacheService,
		),
		deleteUser: new DeleteUserUseCase(repositories.userRepository),
		activateUser: new ActivateUserUseCase(repositories.userRepository, services.userCacheService),
	}
}
