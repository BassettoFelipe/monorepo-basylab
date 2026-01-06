import { getContactValidator, getDocumentValidator } from "@/services/container";
import { CreateTenantUseCase } from "@/use-cases/tenants/create-tenant/create-tenant.use-case";
import { DeleteTenantUseCase } from "@/use-cases/tenants/delete-tenant/delete-tenant.use-case";
import { GetTenantUseCase } from "@/use-cases/tenants/get-tenant/get-tenant.use-case";
import { ListTenantsUseCase } from "@/use-cases/tenants/list-tenants/list-tenants.use-case";
import { UpdateTenantUseCase } from "@/use-cases/tenants/update-tenant/update-tenant.use-case";
import { contractRepository, tenantRepository } from "./repositories";

export function createTenantUseCases() {
  return {
    create: new CreateTenantUseCase(
      tenantRepository,
      getDocumentValidator(),
      getContactValidator(),
    ),
    list: new ListTenantsUseCase(tenantRepository),
    get: new GetTenantUseCase(tenantRepository),
    update: new UpdateTenantUseCase(
      tenantRepository,
      getDocumentValidator(),
      getContactValidator(),
    ),
    delete: new DeleteTenantUseCase(tenantRepository, contractRepository),
  };
}
