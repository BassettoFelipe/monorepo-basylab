import { logger } from "@/config/logger";
import type { User } from "@/db/schema/users";
import { ForbiddenError, InternalServerError } from "@/errors";
import type {
  ContractStats,
  IContractRepository,
} from "@/repositories/contracts/contract.repository";
import type {
  IPropertyRepository,
  PropertyStats,
} from "@/repositories/contracts/property.repository";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type GetDashboardStatsInput = {
  user: User;
};

type DashboardStats = {
  properties: PropertyStats;
  contracts: ContractStats;
  propertyOwners: {
    total: number;
  };
  tenants: {
    total: number;
  };
  expiringContracts: Array<{
    id: string;
    propertyId: string;
    tenantId: string;
    endDate: Date;
    rentalAmount: number;
  }>;
};

const ALLOWED_ROLES: UserRole[] = [
  USER_ROLES.ADMIN,
  USER_ROLES.OWNER,
  USER_ROLES.MANAGER,
  USER_ROLES.BROKER,
  USER_ROLES.INSURANCE_ANALYST,
];

export class GetDashboardStatsUseCase {
  constructor(
    private readonly propertyRepository: IPropertyRepository,
    private readonly contractRepository: IContractRepository,
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(input: GetDashboardStatsInput): Promise<DashboardStats> {
    const currentUser = input.user;

    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para acessar o dashboard.");
    }

    if (currentUser.role !== USER_ROLES.ADMIN && !currentUser.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    try {
      const isBroker = currentUser.role === USER_ROLES.BROKER;
      const companyId = currentUser.companyId ?? "";
      const brokerId = currentUser.id;

      let propertyStats: PropertyStats;
      let contractStats: ContractStats;
      let propertyOwnersTotal: number;
      let tenantsTotal: number;
      let expiringContracts: Array<{
        id: string;
        propertyId: string;
        tenantId: string;
        endDate: Date;
        rentalAmount: number;
      }>;

      if (isBroker) {
        const [
          propertyStatsResult,
          contractStatsResult,
          propertyOwnersCount,
          tenantsCount,
          expiringContractsData,
        ] = await Promise.all([
          this.propertyRepository.getStatsByBrokerId(brokerId, companyId),
          this.contractRepository.getStatsByBrokerId(brokerId, companyId),
          this.propertyOwnerRepository.countByCompanyId(companyId),
          this.tenantRepository.countByCompanyId(companyId),
          this.contractRepository.findExpiringContractsByBroker(companyId, brokerId, 30),
        ]);

        propertyStats = propertyStatsResult;
        contractStats = contractStatsResult;
        propertyOwnersTotal = propertyOwnersCount;
        tenantsTotal = tenantsCount;
        expiringContracts = expiringContractsData.map((c) => ({
          id: c.id,
          propertyId: c.propertyId,
          tenantId: c.tenantId,
          endDate: c.endDate,
          rentalAmount: c.rentalAmount,
        }));
      } else {
        const [
          propertyStatsResult,
          contractStatsResult,
          propertyOwnersCount,
          tenantsCount,
          expiringContractsData,
        ] = await Promise.all([
          this.propertyRepository.getStatsByCompanyId(companyId),
          this.contractRepository.getStatsByCompanyId(companyId),
          this.propertyOwnerRepository.countByCompanyId(companyId),
          this.tenantRepository.countByCompanyId(companyId),
          this.contractRepository.findExpiringContracts(companyId, 30),
        ]);

        propertyStats = propertyStatsResult;
        contractStats = contractStatsResult;
        propertyOwnersTotal = propertyOwnersCount;
        tenantsTotal = tenantsCount;
        expiringContracts = expiringContractsData.map((c) => ({
          id: c.id,
          propertyId: c.propertyId,
          tenantId: c.tenantId,
          endDate: c.endDate,
          rentalAmount: c.rentalAmount,
        }));
      }

      logger.info(
        {
          userId: currentUser.id,
          role: currentUser.role,
          companyId,
        },
        "Dashboard stats retrieved",
      );

      return {
        properties: propertyStats,
        contracts: contractStats,
        propertyOwners: {
          total: propertyOwnersTotal,
        },
        tenants: {
          total: tenantsTotal,
        },
        expiringContracts,
      };
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao buscar estatísticas do dashboard");
      throw new InternalServerError("Erro ao buscar estatísticas do dashboard. Tente novamente.");
    }
  }
}
