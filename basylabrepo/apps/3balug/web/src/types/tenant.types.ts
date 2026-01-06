export interface Tenant {
  id: string;
  name: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  birthDate: string | null;
  monthlyIncome: number | null;
  employer: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  monthlyIncome?: number;
  employer?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
}

export interface UpdateTenantInput {
  name?: string;
  cpf?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  birthDate?: string | null;
  monthlyIncome?: number | null;
  employer?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  notes?: string | null;
}

export interface ListTenantsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListTenantsApiResponse {
  data: Tenant[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListTenantsResponse {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
