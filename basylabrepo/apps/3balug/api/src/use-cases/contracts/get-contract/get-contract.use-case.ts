import { ForbiddenError, InternalServerError, NotFoundError } from "@basylab/core/errors";
import type { ContractStatus } from "@/db/schema/contracts";
import type { ListingType, PropertyStatus, PropertyType } from "@/db/schema/properties";
import type { User } from "@/db/schema/users";
import type { IContractRepository } from "@/repositories/contracts/contract.repository";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type GetContractInput = {
  id: string;
  requestedBy: User;
};

type PropertyDTO = {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
};

type PropertyOwnerDTO = {
  id: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
};

type TenantDTO = {
  id: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
};

type GetContractOutput = {
  id: string;
  companyId: string;
  startDate: Date;
  endDate: Date;
  rentalAmount: number;
  paymentDay: number;
  depositAmount: number | null;
  status: ContractStatus;
  notes: string | null;
  terminatedAt: Date | null;
  terminationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  propertyId: string;
  property: PropertyDTO | null;
  ownerId: string;
  owner: PropertyOwnerDTO | null;
  tenantId: string;
  tenant: TenantDTO | null;
  brokerId: string | null;
  broker: { id: string; name: string; email: string } | null;
};

const ALLOWED_ROLES: UserRole[] = [
  USER_ROLES.OWNER,
  USER_ROLES.MANAGER,
  USER_ROLES.BROKER,
  USER_ROLES.INSURANCE_ANALYST,
];

export class GetContractUseCase {
  constructor(
    private readonly contractRepository: IContractRepository,
    private readonly propertyRepository: IPropertyRepository,
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetContractInput): Promise<GetContractOutput> {
    const currentUser = input.requestedBy;

    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para visualizar contratos.");
    }

    if (!currentUser.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    const contract = await this.contractRepository.findById(input.id);

    if (!contract) {
      throw new NotFoundError("Contrato não encontrado.");
    }

    if (contract.companyId !== currentUser.companyId) {
      throw new ForbiddenError("Você não tem permissão para acessar este contrato.");
    }

    if (currentUser.role === USER_ROLES.BROKER && contract.brokerId !== currentUser.id) {
      throw new ForbiddenError("Você só pode visualizar contratos dos quais é responsável.");
    }

    const [propertyEntity, ownerEntity, tenantEntity, brokerUser] = await Promise.all([
      this.propertyRepository.findById(contract.propertyId),
      this.propertyOwnerRepository.findById(contract.ownerId),
      this.tenantRepository.findById(contract.tenantId),
      contract.brokerId ? this.userRepository.findById(contract.brokerId) : Promise.resolve(null),
    ]);

    const property: PropertyDTO | null = propertyEntity
      ? {
          id: propertyEntity.id,
          title: propertyEntity.title,
          address: propertyEntity.address,
          city: propertyEntity.city,
          type: propertyEntity.type as PropertyType,
          listingType: propertyEntity.listingType as ListingType,
          status: propertyEntity.status as PropertyStatus,
        }
      : null;

    const owner: PropertyOwnerDTO | null = ownerEntity
      ? {
          id: ownerEntity.id,
          name: ownerEntity.name,
          document: ownerEntity.document,
          email: ownerEntity.email,
          phone: ownerEntity.phone,
        }
      : null;

    const tenant: TenantDTO | null = tenantEntity
      ? {
          id: tenantEntity.id,
          name: tenantEntity.name,
          document: tenantEntity.cpf,
          email: tenantEntity.email,
          phone: tenantEntity.phone,
        }
      : null;

    const broker: { id: string; name: string; email: string } | null = brokerUser
      ? {
          id: brokerUser.id,
          name: brokerUser.name,
          email: brokerUser.email,
        }
      : null;

    return {
      id: contract.id,
      companyId: contract.companyId,
      startDate: contract.startDate,
      endDate: contract.endDate,
      rentalAmount: contract.rentalAmount,
      paymentDay: contract.paymentDay,
      depositAmount: contract.depositAmount,
      status: contract.status as ContractStatus,
      notes: contract.notes,
      terminatedAt: contract.terminatedAt,
      terminationReason: contract.terminationReason,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      propertyId: contract.propertyId,
      property,
      ownerId: contract.ownerId,
      owner,
      tenantId: contract.tenantId,
      tenant,
      brokerId: contract.brokerId,
      broker,
    };
  }
}
