import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { terminateContract } from "@/services/contracts/terminate";
import type { TerminateContractInput } from "@/types/contract.types";
import { queryKeys } from "../queryKeys";

interface TerminateContractMutationParams {
  id: string;
  input?: TerminateContractInput;
}

export const useTerminateContractMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: TerminateContractMutationParams) => terminateContract(id, input),
    onSuccess: () => {
      toast.success("Contrato encerrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
    onError: (err: unknown) => {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String(err.response.data.message)
          : "Erro ao encerrar contrato";
      toast.error(errorMessage);
    },
  });
};
