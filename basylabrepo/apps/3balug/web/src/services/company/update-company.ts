import { api } from "@/lib/api";

export interface UpdateCompanyInput {
  name?: string;
}

interface UpdateCompanyResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string | null;
  };
}

export const updateCompany = async (input: UpdateCompanyInput): Promise<UpdateCompanyResponse> => {
  const { data } = await api.put<UpdateCompanyResponse>("/api/companies/me", input);
  return data;
};
