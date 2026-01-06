import { api } from "@/lib/api";
import type { Plan } from "@/types/plan.types";

export const getPlans = async (): Promise<Plan[]> => {
  const { data } = await api.get<Plan[]>("/plans");
  return data;
};
