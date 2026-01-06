import { api } from "@/lib/api";
import type { TeamUser, UpdateUserInput } from "@/types/user.types";

interface UpdateUserResponse {
  data: TeamUser;
  message: string;
}

export const updateUser = async (
  userId: string,
  input: UpdateUserInput,
): Promise<UpdateUserResponse> => {
  const { data } = await api.put<UpdateUserResponse>(`/api/users/${userId}`, input);
  return data;
};
