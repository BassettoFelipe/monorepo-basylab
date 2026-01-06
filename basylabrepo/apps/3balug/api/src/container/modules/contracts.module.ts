import { CreateContractUseCase } from "@/use-cases/contracts/create-contract/create-contract.use-case";
import { GetContractUseCase } from "@/use-cases/contracts/get-contract/get-contract.use-case";
import { ListContractsUseCase } from "@/use-cases/contracts/list-contracts/list-contracts.use-case";
import { TerminateContractUseCase } from "@/use-cases/contracts/terminate-contract/terminate-contract.use-case";
import { UpdateContractUseCase } from "@/use-cases/contracts/update-contract/update-contract.use-case";
import {
  contractRepository,
  propertyOwnerRepository,
  propertyRepository,
  tenantRepository,
  userRepository,
} from "./repositories";

export function createContractUseCases() {
  return {
    create: new CreateContractUseCase(
      contractRepository,
      propertyRepository,
      propertyOwnerRepository,
      tenantRepository,
    ),
    list: new ListContractsUseCase(contractRepository),
    get: new GetContractUseCase(
      contractRepository,
      propertyRepository,
      propertyOwnerRepository,
      tenantRepository,
      userRepository,
    ),
    update: new UpdateContractUseCase(contractRepository, tenantRepository),
    terminate: new TerminateContractUseCase(contractRepository, propertyRepository),
  };
}
