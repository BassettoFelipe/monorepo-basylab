import { api } from "@/lib/api";
import type { Contract, TerminateContractInput } from "@/types/contract.types";

interface TerminateContractResponse {
  data: Contract;
  message: string;
}

export const terminateContract = async (
  id: string,
  input?: TerminateContractInput,
): Promise<TerminateContractResponse> => {
  const { data } = await api.post<TerminateContractResponse>(
    `/api/contracts/${id}/terminate`,
    input || {},
  );
  return data;
};
