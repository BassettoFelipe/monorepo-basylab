import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { deleteProperty } from "@/services/properties/delete";
import type { ListPropertiesResponse } from "@/types/property.types";
import { queryKeys } from "../queryKeys";

export const useDeletePropertyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.properties.all });

      const previousData = queryClient.getQueriesData({
        queryKey: queryKeys.properties.all,
      });

      queryClient.setQueriesData<ListPropertiesResponse>(
        { queryKey: queryKeys.properties.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((property) => property.id !== id),
            total: old.total - 1,
          };
        },
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Imovel deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
    onError: (err: unknown, _id, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String(err.response.data.message)
          : "Erro ao deletar imovel";
      toast.error(errorMessage);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    },
  });
};
