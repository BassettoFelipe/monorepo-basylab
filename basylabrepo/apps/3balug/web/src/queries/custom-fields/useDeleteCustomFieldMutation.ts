import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { queryKeys } from "@/queries/queryKeys";
import { deleteCustomField } from "@/services/custom-fields/delete";
import type { ListCustomFieldsResponse } from "@/types/custom-field.types";

export function useDeleteCustomFieldMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: string) => deleteCustomField(fieldId),

    // Optimistic update - remove imediatamente da lista
    onMutate: async (fieldId) => {
      // Cancela queries em andamento
      await queryClient.cancelQueries({
        queryKey: queryKeys.customFields.list,
      });

      // Snapshot do estado anterior
      const previousData = queryClient.getQueriesData<ListCustomFieldsResponse>({
        queryKey: queryKeys.customFields.list,
      });

      queryClient.setQueriesData<ListCustomFieldsResponse>(
        { queryKey: queryKeys.customFields.list },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((field) => field.id !== fieldId),
          };
        },
      );

      return { previousData };
    },

    onSuccess: (response) => {
      toast.success(response.message || "Campo customizado excluído com sucesso!");
    },

    onError: (err: unknown, _fieldId, context) => {
      // Reverte em caso de erro
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }

      const errorMessage = err instanceof Error ? err.message : "Erro ao excluir campo customizado";
      toast.error(errorMessage);
    },

    onSettled: () => {
      // Revalida para garantir consistência
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.list });
    },
  });
}
