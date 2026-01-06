import { ForbiddenError, InternalServerError } from "@basylab/core/errors";
import { logger } from "@/config/logger";
import type { User } from "@/db/schema/users";
import type { ICompanyRepository } from "@/repositories/contracts/company.repository";
import type { ICompanyCacheService } from "@/services/cache";
import { USER_ROLES } from "@/types/roles";

type UpdateCompanyInput = {
  updatedBy: User;
  name?: string;
};

type UpdateCompanyOutput = {
  id: string;
  name: string;
  email: string | null;
};

export class UpdateCompanyUseCase {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly cache: ICompanyCacheService,
  ) {}

  async execute(input: UpdateCompanyInput): Promise<UpdateCompanyOutput> {
    const user = input.updatedBy;

    if (user.role !== USER_ROLES.OWNER) {
      throw new ForbiddenError("Apenas o proprietário pode atualizar a empresa");
    }

    if (!user.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada");
    }

    const updatedCompany = await this.companyRepository.update(user.companyId, {
      name: input.name,
    });

    if (!updatedCompany) {
      throw new InternalServerError("Erro ao atualizar empresa");
    }

    await this.cache.invalidate(user.companyId);

    logger.info(
      {
        event: "COMPANY_UPDATED",
        companyId: updatedCompany.id,
        userId: user.id,
      },
      `Empresa atualizada: ${updatedCompany.name}`,
    );

    return {
      id: updatedCompany.id,
      name: updatedCompany.name,
      email: updatedCompany.email,
    };
  }
}
