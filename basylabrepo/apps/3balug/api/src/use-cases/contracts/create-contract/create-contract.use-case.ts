import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@basylab/core/errors";
import { logger } from "@/config/logger";
import { CONTRACT_STATUS } from "@/db/schema/contracts";
import { PROPERTY_STATUS } from "@/db/schema/properties";
import type { User } from "@/db/schema/users";
import type { IContractRepository } from "@/repositories/contracts/contract.repository";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type CreateContractInput = {
  propertyId: string;
  tenantId: string;
  brokerId?: string;
  startDate: Date;
  endDate: Date;
  rentalAmount: number;
  paymentDay: number;
  depositAmount?: number;
  notes?: string;
  createdBy: User;
};

type CreateContractOutput = {
  id: string;
  companyId: string;
  propertyId: string;
  ownerId: string;
  tenantId: string;
  brokerId: string | null;
  startDate: Date;
  endDate: Date;
  rentalAmount: number;
  paymentDay: number;
  depositAmount: number | null;
  status: string;
  notes: string | null;
  createdAt: Date;
};

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER];

export class CreateContractUseCase {
  constructor(
    private readonly contractRepository: IContractRepository,
    private readonly propertyRepository: IPropertyRepository,
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(input: CreateContractInput): Promise<CreateContractOutput> {
    const currentUser = input.createdBy;

    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para criar contratos.");
    }

    if (!currentUser.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    if (input.startDate >= input.endDate) {
      throw new BadRequestError("A data de início deve ser anterior à data de término.");
    }

    if (input.paymentDay < 1 || input.paymentDay > 31) {
      throw new BadRequestError("O dia de pagamento deve estar entre 1 e 31.");
    }

    if (input.rentalAmount <= 0) {
      throw new BadRequestError("O valor do aluguel deve ser maior que zero.");
    }

    const property = await this.propertyRepository.findById(input.propertyId);

    if (!property) {
      throw new NotFoundError("Imóvel não encontrado.");
    }

    if (property.companyId !== currentUser.companyId) {
      throw new ForbiddenError("Imóvel não pertence à sua empresa.");
    }

    if (property.status !== PROPERTY_STATUS.AVAILABLE) {
      throw new BadRequestError(
        `O imóvel não está disponível para locação. Status atual: ${property.status}.`,
      );
    }

    if (currentUser.role === USER_ROLES.BROKER && property.brokerId !== currentUser.id) {
      throw new ForbiddenError(
        "Você só pode criar contratos para imóveis dos quais é responsável.",
      );
    }

    const existingContract = await this.contractRepository.findActiveByPropertyId(input.propertyId);
    if (existingContract) {
      throw new BadRequestError("Já existe um contrato ativo para este imóvel.");
    }

    const propertyOwner = await this.propertyOwnerRepository.findById(property.ownerId);
    if (!propertyOwner) {
      throw new InternalServerError("Proprietário do imóvel não encontrado.");
    }

    const tenant = await this.tenantRepository.findById(input.tenantId);

    if (!tenant) {
      throw new NotFoundError("Locatário não encontrado.");
    }

    if (tenant.companyId !== currentUser.companyId) {
      throw new ForbiddenError("Locatário não pertence à sua empresa.");
    }

    if (currentUser.role === USER_ROLES.BROKER && tenant.createdBy !== currentUser.id) {
      throw new ForbiddenError("Você só pode criar contratos com locatários que você cadastrou.");
    }

    let brokerId = input.brokerId || property.brokerId || null;

    if (currentUser.role === USER_ROLES.BROKER) {
      brokerId = currentUser.id;
    }

    try {
      const contract = await this.contractRepository.createWithPropertyUpdate(
        {
          companyId: currentUser.companyId,
          propertyId: input.propertyId,
          ownerId: property.ownerId,
          tenantId: input.tenantId,
          brokerId,
          startDate: input.startDate,
          endDate: input.endDate,
          rentalAmount: input.rentalAmount,
          paymentDay: input.paymentDay,
          depositAmount: input.depositAmount || null,
          status: CONTRACT_STATUS.ACTIVE,
          notes: input.notes?.trim() || null,
          createdBy: currentUser.id,
        },
        input.propertyId,
        PROPERTY_STATUS.RENTED,
      );

      logger.info(
        {
          contractId: contract.id,
          propertyId: contract.propertyId,
          tenantId: contract.tenantId,
          companyId: contract.companyId,
          createdBy: currentUser.id,
        },
        "Contrato criado com sucesso",
      );

      return {
        id: contract.id,
        companyId: contract.companyId,
        propertyId: contract.propertyId,
        ownerId: contract.ownerId,
        tenantId: contract.tenantId,
        brokerId: contract.brokerId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentalAmount: contract.rentalAmount,
        paymentDay: contract.paymentDay,
        depositAmount: contract.depositAmount,
        status: contract.status,
        notes: contract.notes,
        createdAt: contract.createdAt,
      };
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao criar contrato");
      throw new InternalServerError("Erro ao criar contrato. Tente novamente.");
    }
  }
}
