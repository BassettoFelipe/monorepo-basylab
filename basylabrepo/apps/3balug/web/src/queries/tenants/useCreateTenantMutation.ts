import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTenant } from "@/services/tenants/create";
import type { CreateTenantInput } from "@/types/tenant.types";
import { queryKeys } from "../queryKeys";

export const useCreateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTenantInput) => createTenant(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tenants.all,
        refetchType: "active",
      });
    },
  });
};
