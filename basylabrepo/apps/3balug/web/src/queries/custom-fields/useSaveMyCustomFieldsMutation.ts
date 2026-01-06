import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/queries/queryKeys";
import type {
  SaveMyCustomFieldsInput,
  SaveMyCustomFieldsResponse,
} from "@/types/custom-field.types";

async function saveMyCustomFields(
  data: SaveMyCustomFieldsInput,
): Promise<SaveMyCustomFieldsResponse> {
  const response = await api.post<SaveMyCustomFieldsResponse>("/custom-fields/my-fields", data);
  return response.data;
}

export function useSaveMyCustomFieldsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveMyCustomFields,
    onSuccess: () => {
      // Invalidar cache dos campos customizados e do usuário
      queryClient.invalidateQueries({
        queryKey: queryKeys.customFields.myFields,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}
