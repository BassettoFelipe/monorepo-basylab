import { ForbiddenError, InternalServerError, NotFoundError } from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { ITenantRepository } from "@/repositories/contracts/tenant.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type GetTenantInput = {
  id: string;
  requestedBy: User;
};

type GetTenantOutput = {
  id: string;
  name: string;
  companyId: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  monthlyIncome: number | null;
  employer: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
};

const ALLOWED_ROLES: UserRole[] = [
  USER_ROLES.OWNER,
  USER_ROLES.MANAGER,
  USER_ROLES.BROKER,
  USER_ROLES.INSURANCE_ANALYST,
];

export class GetTenantUseCase {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(input: GetTenantInput): Promise<GetTenantOutput> {
    const currentUser = input.requestedBy;

    if (!ALLOWED_ROLES.includes(currentUser.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para visualizar locatários.");
    }

    if (!currentUser.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    const tenant = await this.tenantRepository.findById(input.id);

    if (!tenant || tenant.companyId !== currentUser.companyId) {
      throw new NotFoundError("Locatário não encontrado.");
    }

    if (currentUser.role === USER_ROLES.BROKER && tenant.createdBy !== currentUser.id) {
      throw new ForbiddenError("Você só pode visualizar locatários que você cadastrou.");
    }

    return {
      id: tenant.id,
      name: tenant.name,
      companyId: tenant.companyId,
      cpf: tenant.cpf,
      email: tenant.email,
      phone: tenant.phone,
      birthDate: tenant.birthDate,
      monthlyIncome: tenant.monthlyIncome,
      employer: tenant.employer,
      emergencyContact: tenant.emergencyContact,
      emergencyPhone: tenant.emergencyPhone,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
      zipCode: tenant.zipCode,
      notes: tenant.notes,
    };
  }
}
