import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { queryKeys } from "@/queries/queryKeys";
import { type CreateCustomFieldPayload, createCustomField } from "@/services/custom-fields/create";
import type { ListCustomFieldsResponse } from "@/types/custom-field.types";

export function useCreateCustomFieldMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomFieldPayload) => createCustomField(payload),

    onSuccess: (response) => {
      // Adiciona o novo campo diretamente no cache
      queryClient.setQueriesData<ListCustomFieldsResponse>(
        { queryKey: queryKeys.customFields.list },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [...old.data, response.data],
          };
        },
      );

      toast.success(response.message || "Campo customizado criado com sucesso!");
    },

    onError: (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar campo customizado";
      toast.error(errorMessage);
    },

    onSettled: () => {
      // Revalida para garantir consistência
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.list });
    },
  });
}
