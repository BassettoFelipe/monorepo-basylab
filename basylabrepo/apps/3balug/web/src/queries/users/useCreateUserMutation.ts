import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "@/services/users/create-user";
import type { CreateUserInput } from "@/types/user.types";
import { queryKeys } from "../queryKeys";

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: async () => {
      // Invalida e refetch imediatamente todas as queries de listagem de usuários
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
        refetchType: "active",
      });
    },
  });
};
