import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTenant } from "@/services/tenants/update";
import type { UpdateTenantInput } from "@/types/tenant.types";
import { queryKeys } from "../queryKeys";

interface UpdateTenantMutationParams {
  id: string;
  input: UpdateTenantInput;
}

export const useUpdateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateTenantMutationParams) => updateTenant(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
};
