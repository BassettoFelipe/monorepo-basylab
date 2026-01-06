import { logger } from "@/config/logger";
import type { Contract } from "@/db/schema/contracts";
import { CONTRACT_STATUS } from "@/db/schema/contracts";
import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IContractRepository } from "@/repositories/contracts/contract.repository";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type UpdateContractInput = {
  id: string;
  tenantId?: string;
  brokerId?: string | null;
  startDate?: Date;
  endDate?: Date;
  rentalAmount?: number;
  paymentDay?: number;
  depositAmount?: number | null;
  notes?: string | null;
  updatedBy: User;
};

type UpdateContractOutput = Contract;

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER];

export class UpdateContractUseCase {
  constructor(
    private readonly contractRepository: IContractRepository,
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(input: UpdateContractInput): Promise<UpdateContractOutput> {
    const currentUser = input.updatedBy;

    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para editar contratos.");
    }

    if (!currentUser.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    const contract = await this.contractRepository.findById(input.id);

    if (!contract) {
      throw new NotFoundError("Contrato não encontrado.");
    }

    if (contract.companyId !== currentUser.companyId) {
      throw new ForbiddenError("Você não tem permissão para editar este contrato.");
    }

    if (contract.status !== CONTRACT_STATUS.ACTIVE) {
      throw new BadRequestError("Apenas contratos ativos podem ser editados.");
    }

    const updateData: Partial<Contract> = {};

    if (input.tenantId !== undefined && input.tenantId !== contract.tenantId) {
      const newTenant = await this.tenantRepository.findById(input.tenantId);
      if (!newTenant) {
        throw new NotFoundError("Locatário não encontrado.");
      }
      if (newTenant.companyId !== currentUser.companyId) {
        throw new ForbiddenError("Locatário não pertence à sua empresa.");
      }
      updateData.tenantId = input.tenantId;
    }

    if (input.brokerId !== undefined) {
      updateData.brokerId = input.brokerId;
    }

    if (input.startDate !== undefined || input.endDate !== undefined) {
      const newStartDate = input.startDate ?? contract.startDate;
      const newEndDate = input.endDate ?? contract.endDate;

      if (newStartDate >= newEndDate) {
        throw new BadRequestError("A data de início deve ser anterior à data de término.");
      }

      if (input.startDate !== undefined) {
        updateData.startDate = input.startDate;
      }
      if (input.endDate !== undefined) {
        updateData.endDate = input.endDate;
      }
    }

    if (input.rentalAmount !== undefined) {
      if (input.rentalAmount <= 0) {
        throw new BadRequestError("O valor do aluguel deve ser maior que zero.");
      }
      updateData.rentalAmount = input.rentalAmount;
    }

    if (input.paymentDay !== undefined) {
      if (input.paymentDay < 1 || input.paymentDay > 31) {
        throw new BadRequestError("O dia de pagamento deve estar entre 1 e 31.");
      }
      updateData.paymentDay = input.paymentDay;
    }

    if (input.depositAmount !== undefined) {
      updateData.depositAmount = input.depositAmount;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return contract;
    }

    try {
      const updatedContract = await this.contractRepository.update(input.id, updateData);

      if (!updatedContract) {
        throw new InternalServerError("Erro ao atualizar contrato.");
      }

      logger.info(
        {
          contractId: updatedContract.id,
          updatedBy: currentUser.id,
        },
        "Contrato atualizado com sucesso",
      );

      return updatedContract;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao atualizar contrato");
      throw new InternalServerError("Erro ao atualizar contrato. Tente novamente.");
    }
  }
}
