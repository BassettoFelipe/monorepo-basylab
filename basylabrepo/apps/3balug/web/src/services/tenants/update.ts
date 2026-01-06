import { api } from "@/lib/api";
import type { Tenant, UpdateTenantInput } from "@/types/tenant.types";

interface UpdateTenantResponse {
  data: Tenant;
  message: string;
}

export const updateTenant = async (
  id: string,
  input: UpdateTenantInput,
): Promise<UpdateTenantResponse> => {
  const { data } = await api.patch<UpdateTenantResponse>(`/api/tenants/${id}`, input);
  return data;
};
