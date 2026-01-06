import type { Contract, ContractStatus, NewContract } from "@/db/schema/contracts";
import type { PropertyStatus } from "@/db/schema/properties";

export type ContractFilters = {
  companyId: string;
  propertyId?: string;
  ownerId?: string;
  tenantId?: string;
  brokerId?: string;
  status?: ContractStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  limit?: number;
  offset?: number;
};

export type ContractListResult = {
  data: Contract[];
  total: number;
  limit: number;
  offset: number;
};

export type ContractStats = {
  total: number;
  active: number;
  terminated: number;
  cancelled: number;
  expired: number;
  monthlyRevenue: number; // Soma dos valores de aluguel dos contratos ativos em centavos
};

export interface IContractRepository {
  findById(id: string): Promise<Contract | null>;
  findByPropertyId(propertyId: string): Promise<Contract[]>;
  findActiveByPropertyId(propertyId: string): Promise<Contract | null>;
  findByTenantId(tenantId: string): Promise<Contract[]>;
  findActiveByTenantId(tenantId: string): Promise<Contract[]>;
  findByCompanyId(companyId: string): Promise<Contract[]>;
  findByBrokerId(brokerId: string): Promise<Contract[]>;
  list(filters: ContractFilters): Promise<ContractListResult>;
  create(data: NewContract): Promise<Contract>;
  createWithPropertyUpdate(
    contractData: NewContract,
    propertyId: string,
    propertyStatus: PropertyStatus,
  ): Promise<Contract>;
  terminateWithPropertyUpdate(
    contractId: string,
    propertyId: string,
    terminationData: {
      terminatedAt: Date;
      terminationReason?: string | null;
    },
  ): Promise<Contract>;
  update(id: string, data: Partial<NewContract>): Promise<Contract | null>;
  delete(id: string): Promise<boolean>;
  countByCompanyId(companyId: string): Promise<number>;
  countActiveByCompanyId(companyId: string): Promise<number>;
  countByTenantId(tenantId: string): Promise<number>;
  countActiveByTenantId(tenantId: string): Promise<number>;
  getStatsByCompanyId(companyId: string): Promise<ContractStats>;
  getStatsByBrokerId(brokerId: string, companyId: string): Promise<ContractStats>;
  findExpiringContracts(companyId: string, daysAhead: number): Promise<Contract[]>;
  findExpiringContractsByBroker(
    companyId: string,
    brokerId: string,
    daysAhead: number,
  ): Promise<Contract[]>;
}
