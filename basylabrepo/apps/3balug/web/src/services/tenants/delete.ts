import { api } from "@/lib/api";
import type { Tenant } from "@/types/tenant.types";

interface DeleteTenantResponse {
  data: Tenant;
  message: string;
}

export const deleteTenant = async (id: string): Promise<DeleteTenantResponse> => {
  const { data } = await api.delete<DeleteTenantResponse>(`/api/tenants/${id}`);
  return data;
};
