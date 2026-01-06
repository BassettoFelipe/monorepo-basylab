import { InternalServerError, NotFoundError } from "@basylab/core/errors";
import type { Company } from "@/db/schema/companies";
import type { User } from "@/db/schema/users";
import type { ICompanyRepository } from "@/repositories/contracts/company.repository";
import type { ICompanyCacheService } from "@/services/cache";

type GetCompanyInput = {
  requestedBy: User;
};

type GetCompanyOutput = {
  id: string;
  name: string;
  email: string | null;
  cnpj: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
};

export class GetCompanyUseCase {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly cache: ICompanyCacheService,
  ) {}

  async execute(input: GetCompanyInput): Promise<GetCompanyOutput> {
    const user = input.requestedBy;

    if (!user.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada");
    }

    const cached = await this.cache.get(user.companyId);
    let company: Company | null = cached;

    if (!company) {
      company = await this.companyRepository.findById(user.companyId);
      if (!company) {
        throw new NotFoundError("Empresa não encontrada");
      }
      await this.cache.set(user.companyId, company);
    }

    return {
      id: company.id,
      name: company.name,
      email: company.email,
      cnpj: company.cnpj,
      phone: company.phone,
      address: company.address,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
    };
  }
}
