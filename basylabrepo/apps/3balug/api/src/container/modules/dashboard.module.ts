import { GetDashboardStatsUseCase } from "@/use-cases/dashboard/get-dashboard-stats/get-dashboard-stats.use-case";
import {
  contractRepository,
  propertyOwnerRepository,
  propertyRepository,
  tenantRepository,
} from "./repositories";

export function createDashboardUseCases() {
  return {
    getStats: new GetDashboardStatsUseCase(
      propertyRepository,
      contractRepository,
      propertyOwnerRepository,
      tenantRepository,
    ),
  };
}
