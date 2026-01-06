import { useQuery } from "@tanstack/react-query";
import { getPlans } from "@/services/plans/get-plans";
import type { Plan } from "@/types/plan.types";
import { queryKeys } from "../queryKeys";

export const usePlansQuery = () =>
  useQuery<Plan[]>({
    queryKey: queryKeys.plans.list,
    queryFn: getPlans,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
