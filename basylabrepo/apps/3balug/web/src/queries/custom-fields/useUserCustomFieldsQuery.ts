import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/queries/queryKeys";
import type { CustomFieldWithValue } from "@/types/custom-field.types";

interface UserCustomFieldsResponse {
  success: boolean;
  data: CustomFieldWithValue[];
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

async function fetchUserCustomFields(userId: string): Promise<UserCustomFieldsResponse> {
  const response = await api.get<UserCustomFieldsResponse>(`/custom-fields/user/${userId}`);
  return response.data;
}

export function useUserCustomFieldsQuery(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.customFields.userFields(userId ?? ""),
    queryFn: () => fetchUserCustomFields(userId ?? ""),
    enabled: !!userId,
  });
}
