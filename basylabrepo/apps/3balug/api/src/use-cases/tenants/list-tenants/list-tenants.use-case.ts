import type { Tenant } from "@/db/schema/tenants";
import type { User } from "@/db/schema/users";
import { ForbiddenError, InternalServerError } from "@/errors";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type ListTenantsInput = {
  search?: string;
  limit?: number;
  offset?: number;
  requestedBy: User;
};

type TenantListItem = Omit<Tenant, "updatedAt" | "createdBy" | "companyId">;

type ListTenantsOutput = {
  data: TenantListItem[];
  total: number;
  limit: number;
  offset: number;
};

const ALLOWED_ROLES: UserRole[] = [
  USER_ROLES.OWNER,
  USER_ROLES.MANAGER,
  USER_ROLES.BROKER,
  USER_ROLES.INSURANCE_ANALYST,
];

export class ListTenantsUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(input: ListTenantsInput): Promise<ListTenantsOutput> {
    const currentUser = input.requestedBy;

    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para listar locatários.");
    }

    if (!currentUser.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    let createdBy: string | undefined;
    if (currentUser.role === USER_ROLES.BROKER) {
      createdBy = currentUser.id;
    }

    const result = await this.tenantRepository.list({
      companyId: currentUser.companyId,
      search: input.search,
      createdBy,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    });

    const cleanData: TenantListItem[] = result.data.map((tenant) => {
      const {
        updatedAt: _updatedAt,
        createdBy: _createdBy,
        companyId: _companyId,
        ...rest
      } = tenant;
      return rest;
    });

    return {
      data: cleanData,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }
}
