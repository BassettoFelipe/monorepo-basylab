import { useQuery } from "@tanstack/react-query";
import { listPropertyOwners } from "@/services/property-owners/list";
import type {
  ListPropertyOwnersParams,
  ListPropertyOwnersResponse,
} from "@/types/property-owner.types";
import { queryKeys } from "../queryKeys";

export const usePropertyOwnersQuery = (params?: ListPropertyOwnersParams) => {
  return useQuery<ListPropertyOwnersResponse>({
    queryKey: queryKeys.propertyOwners.list(params),
    queryFn: () => listPropertyOwners(params),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
};
