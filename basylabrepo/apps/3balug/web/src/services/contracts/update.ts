import { api } from "@/lib/api";
import type { Contract, UpdateContractInput } from "@/types/contract.types";

interface UpdateContractResponse {
  data: Contract;
  message: string;
}

export const updateContract = async (
  id: string,
  input: UpdateContractInput,
): Promise<UpdateContractResponse> => {
  const { data } = await api.patch<UpdateContractResponse>(`/api/contracts/${id}`, input);
  return data;
};
