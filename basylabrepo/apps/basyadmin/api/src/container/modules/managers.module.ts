import { AssignTenantUseCase } from '@/use-cases/managers/assign-tenant/assign-tenant.use-case'
import { CreateManagerUseCase } from '@/use-cases/managers/create-manager/create-manager.use-case'
import { DeleteManagerUseCase } from '@/use-cases/managers/delete-manager/delete-manager.use-case'
import { GetManagerUseCase } from '@/use-cases/managers/get-manager/get-manager.use-case'
import { ListManagersUseCase } from '@/use-cases/managers/list-managers/list-managers.use-case'
import { RemoveTenantUseCase } from '@/use-cases/managers/remove-tenant/remove-tenant.use-case'
import { UpdateManagerUseCase } from '@/use-cases/managers/update-manager/update-manager.use-case'
import { repositories } from './repositories'

export function createManagerUseCases() {
	return {
		create: new CreateManagerUseCase(repositories.userRepository),
		list: new ListManagersUseCase(repositories.userRepository),
		get: new GetManagerUseCase(repositories.userRepository),
		update: new UpdateManagerUseCase(repositories.userRepository),
		delete: new DeleteManagerUseCase(repositories.userRepository),
		assignTenant: new AssignTenantUseCase(
			repositories.userRepository,
			repositories.tenantRepository,
		),
		removeTenant: new RemoveTenantUseCase(
			repositories.userRepository,
			repositories.tenantRepository,
		),
	}
}
