import { GetDashboardStatsUseCase } from "@/use-cases/dashboard/get-dashboard-stats/get-dashboard-stats.use-case";
import { repositories } from "./repositories";

export function createDashboardUseCases() {
  return {
    getStats: new GetDashboardStatsUseCase(
      repositories.propertyRepository,
      repositories.contractRepository,
      repositories.propertyOwnerRepository,
      repositories.tenantRepository,
    ),
  };
}
