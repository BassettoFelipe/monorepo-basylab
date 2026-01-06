import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import {
  type UploadPropertyPhotoInput,
  type UploadPropertyPhotoResponse,
  uploadPropertyPhoto,
} from "@/services/property-photos/upload";

export const useUploadPropertyPhotoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<UploadPropertyPhotoResponse, Error, UploadPropertyPhotoInput>({
    mutationFn: uploadPropertyPhoto,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.properties.detail(variables.propertyId),
        refetchType: "active",
      });
    },
  });
};
