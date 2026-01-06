import { useQuery } from "@tanstack/react-query";
import { listContracts } from "@/services/contracts/list";
import type { ListContractsParams, ListContractsResponse } from "@/types/contract.types";
import { queryKeys } from "../queryKeys";

export const useContractsQuery = (params?: ListContractsParams) => {
  return useQuery<ListContractsResponse>({
    queryKey: queryKeys.contracts.list(params),
    queryFn: () => listContracts(params),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
};
