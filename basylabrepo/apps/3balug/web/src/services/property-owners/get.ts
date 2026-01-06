import { api } from "@/lib/api";
import type { PropertyOwner } from "@/types/property-owner.types";

interface GetPropertyOwnerResponse {
  success: boolean;
  data: PropertyOwner;
}

export const getPropertyOwner = async (id: string): Promise<PropertyOwner> => {
  const { data } = await api.get<GetPropertyOwnerResponse>(`/api/property-owners/${id}`);
  return data.data;
};
