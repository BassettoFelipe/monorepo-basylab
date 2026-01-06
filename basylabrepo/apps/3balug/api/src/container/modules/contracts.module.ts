import { CreateContractUseCase } from '@/use-cases/contracts/create-contract/create-contract.use-case'
import { GetContractUseCase } from '@/use-cases/contracts/get-contract/get-contract.use-case'
import { ListContractsUseCase } from '@/use-cases/contracts/list-contracts/list-contracts.use-case'
import { TerminateContractUseCase } from '@/use-cases/contracts/terminate-contract/terminate-contract.use-case'
import { UpdateContractUseCase } from '@/use-cases/contracts/update-contract/update-contract.use-case'
import { repositories } from './repositories'

export function createContractUseCases() {
	return {
		create: new CreateContractUseCase(
			repositories.contractRepository,
			repositories.propertyRepository,
			repositories.propertyOwnerRepository,
			repositories.tenantRepository,
		),
		list: new ListContractsUseCase(repositories.contractRepository),
		get: new GetContractUseCase(
			repositories.contractRepository,
			repositories.propertyRepository,
			repositories.propertyOwnerRepository,
			repositories.tenantRepository,
			repositories.userRepository,
		),
		update: new UpdateContractUseCase(
			repositories.contractRepository,
			repositories.tenantRepository,
		),
		terminate: new TerminateContractUseCase(
			repositories.contractRepository,
			repositories.propertyRepository,
		),
	}
}
