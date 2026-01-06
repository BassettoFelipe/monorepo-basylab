import { api } from "@/lib/api";
import type { ListUsersParams, ListUsersResponse } from "@/types/user.types";

export const listUsers = async (params?: ListUsersParams): Promise<ListUsersResponse> => {
  const { data } = await api.get<{ success: boolean; data: ListUsersResponse }>("/api/users", {
    params,
  });
  return data.data;
};
