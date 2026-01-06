import { api } from "@/lib/api";
import type { Contract } from "@/types/contract.types";

interface GetContractResponse {
  data: Contract;
}

export const getContract = async (id: string): Promise<Contract> => {
  const { data } = await api.get<GetContractResponse>(`/api/contracts/${id}`);
  return data.data;
};
