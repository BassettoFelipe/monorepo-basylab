import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateContract } from "@/services/contracts/update";
import type { UpdateContractInput } from "@/types/contract.types";
import { queryKeys } from "../queryKeys";

interface UpdateContractMutationParams {
  id: string;
  input: UpdateContractInput;
}

export const useUpdateContractMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateContractMutationParams) => updateContract(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
};
