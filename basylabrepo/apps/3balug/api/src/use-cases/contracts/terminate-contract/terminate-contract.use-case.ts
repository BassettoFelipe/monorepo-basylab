import { logger } from "@/config/logger";
import type { Contract } from "@/db/schema/contracts";
import { CONTRACT_STATUS } from "@/db/schema/contracts";
import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IContractRepository } from "@/repositories/contracts/contract.repository";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type TerminateContractInput = {
  id: string;
  reason?: string;
  terminatedBy: User;
};

type TerminateContractOutput = Contract;

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER];

export class TerminateContractUseCase {
  constructor(
    private readonly contractRepository: IContractRepository,
    readonly _propertyRepository: IPropertyRepository,
  ) {}

  async execute(input: TerminateContractInput): Promise<TerminateContractOutput> {
    const currentUser = input.terminatedBy;

    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para encerrar contratos.");
    }

    if (!currentUser.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    const contract = await this.contractRepository.findById(input.id);

    if (!contract) {
      throw new NotFoundError("Contrato não encontrado.");
    }

    if (contract.companyId !== currentUser.companyId) {
      throw new ForbiddenError("Você não tem permissão para encerrar este contrato.");
    }

    if (contract.status !== CONTRACT_STATUS.ACTIVE) {
      throw new BadRequestError("Apenas contratos ativos podem ser encerrados.");
    }

    try {
      const terminatedContract = await this.contractRepository.terminateWithPropertyUpdate(
        input.id,
        contract.propertyId,
        {
          terminatedAt: new Date(),
          terminationReason: input.reason?.trim() || null,
        },
      );

      logger.info(
        {
          contractId: terminatedContract.id,
          propertyId: contract.propertyId,
          terminatedBy: currentUser.id,
          reason: input.reason,
        },
        "Contrato encerrado com sucesso",
      );

      return terminatedContract;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao encerrar contrato");
      throw new InternalServerError("Erro ao encerrar contrato. Tente novamente.");
    }
  }
}
