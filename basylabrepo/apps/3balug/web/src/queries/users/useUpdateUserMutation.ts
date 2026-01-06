import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/services/users/update-user";
import type { UpdateUserInput } from "@/types/user.types";
import { queryKeys } from "../queryKeys";

interface UpdateUserMutationParams {
  userId: string;
  input: UpdateUserInput;
}

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: UpdateUserMutationParams) => updateUser(userId, input),
    onSuccess: () => {
      // Invalida todas as queries de listagem de usuários
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};
