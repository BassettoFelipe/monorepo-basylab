import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/dashboard/get-stats";
import type { DashboardStats } from "@/types/dashboard.types";
import { queryKeys } from "../queryKeys";

export const useDashboardStatsQuery = () => {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard.stats,
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
