import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPropertyOwner } from "@/services/property-owners/create";
import type { CreatePropertyOwnerInput } from "@/types/property-owner.types";
import { queryKeys } from "../queryKeys";

export const useCreatePropertyOwnerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePropertyOwnerInput) => createPropertyOwner(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.propertyOwners.all,
        refetchType: "active",
      });
    },
  });
};
