import { api } from "@/lib/api";
import type { Tenant } from "@/types/tenant.types";

interface GetTenantResponse {
  success: boolean;
  data: Tenant;
}

export const getTenant = async (id: string): Promise<Tenant> => {
  const { data } = await api.get<GetTenantResponse>(`/api/tenants/${id}`);
  return data.data;
};
