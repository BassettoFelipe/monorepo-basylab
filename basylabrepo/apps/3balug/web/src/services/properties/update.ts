import { api } from "@/lib/api";
import type { Property, UpdatePropertyInput } from "@/types/property.types";

interface UpdatePropertyResponse {
  data: Property;
  message: string;
}

export const updateProperty = async (
  id: string,
  input: UpdatePropertyInput,
): Promise<UpdatePropertyResponse> => {
  const { data } = await api.patch<UpdatePropertyResponse>(`/api/properties/${id}`, input);
  return data;
};
