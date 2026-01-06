import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import {
  type SetPrimaryPhotoInput,
  type SetPrimaryPhotoResponse,
  setPrimaryPhoto,
} from "@/services/property-photos/set-primary";

export const useSetPrimaryPhotoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SetPrimaryPhotoResponse, Error, SetPrimaryPhotoInput>({
    mutationFn: setPrimaryPhoto,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.properties.detail(variables.propertyId),
        refetchType: "active",
      });
    },
  });
};
