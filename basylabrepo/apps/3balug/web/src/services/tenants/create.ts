import { api } from "@/lib/api";
import type { CreateTenantInput, Tenant } from "@/types/tenant.types";

interface CreateTenantResponse {
  data: Tenant;
  message: string;
}

export const createTenant = async (input: CreateTenantInput): Promise<CreateTenantResponse> => {
  const { data } = await api.post<CreateTenantResponse>("/api/tenants", input);
  return data;
};
