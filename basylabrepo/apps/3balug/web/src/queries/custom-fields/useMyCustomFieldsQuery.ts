import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/queries/queryKeys";
import type { MyCustomFieldsResponse } from "@/types/custom-field.types";

async function fetchMyCustomFields(): Promise<MyCustomFieldsResponse> {
  const response = await api.get<MyCustomFieldsResponse>("/custom-fields/my-fields");
  return response.data;
}

export function useMyCustomFieldsQuery() {
  return useQuery({
    queryKey: queryKeys.customFields.myFields,
    queryFn: fetchMyCustomFields,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
