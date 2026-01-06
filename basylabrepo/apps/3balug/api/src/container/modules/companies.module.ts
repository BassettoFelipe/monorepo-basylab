import { GetCompanyUseCase } from "@/use-cases/companies/get-company/get-company.use-case";
import { UpdateCompanyUseCase } from "@/use-cases/companies/update-company/update-company.use-case";
import { companyRepository } from "./repositories";
import { companyCacheService } from "./services";

export function createCompanyUseCases() {
  return {
    get: new GetCompanyUseCase(companyRepository, companyCacheService),
    update: new UpdateCompanyUseCase(companyRepository, companyCacheService),
  };
}
