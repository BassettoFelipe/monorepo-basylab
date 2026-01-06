import { api } from "@/lib/api";
import type {
  ListContractsApiResponse,
  ListContractsParams,
  ListContractsResponse,
} from "@/types/contract.types";

export const listContracts = async (
  params?: ListContractsParams,
): Promise<ListContractsResponse> => {
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;

  const { data } = await api.get<{ success: boolean } & ListContractsApiResponse>(
    "/api/contracts",
    {
      params: {
        status: params?.status,
        propertyId: params?.propertyId,
        tenantId: params?.tenantId,
        ownerId: params?.ownerId,
        page,
        limit,
      },
    },
  );

  return {
    data: data.data,
    total: data.pagination.total,
    page: data.pagination.page,
    limit: data.pagination.limit,
    totalPages: data.pagination.totalPages,
  };
};
