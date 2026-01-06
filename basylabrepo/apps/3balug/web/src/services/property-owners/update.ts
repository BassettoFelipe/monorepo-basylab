import { api } from "@/lib/api";
import type { PropertyOwner, UpdatePropertyOwnerInput } from "@/types/property-owner.types";

interface UpdatePropertyOwnerResponse {
  data: PropertyOwner;
  message: string;
}

export const updatePropertyOwner = async (
  id: string,
  input: UpdatePropertyOwnerInput,
): Promise<UpdatePropertyOwnerResponse> => {
  const { data } = await api.patch<UpdatePropertyOwnerResponse>(
    `/api/property-owners/${id}`,
    input,
  );
  return data;
};
