import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProperty } from "@/services/properties/create";
import type { CreatePropertyInput } from "@/types/property.types";
import { queryKeys } from "../queryKeys";

export const useCreatePropertyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePropertyInput) => createProperty(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.properties.all,
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.stats,
        refetchType: "active",
      });
    },
  });
};
