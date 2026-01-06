import { GetCompanyUseCase } from "@/use-cases/companies/get-company/get-company.use-case";
import { UpdateCompanyUseCase } from "@/use-cases/companies/update-company/update-company.use-case";
import { repositories } from "./repositories";
import { services } from "./services";

export function createCompanyUseCases() {
  return {
    get: new GetCompanyUseCase(repositories.companyRepository, services.companyCacheService),
    update: new UpdateCompanyUseCase(repositories.companyRepository, services.companyCacheService),
  };
}
