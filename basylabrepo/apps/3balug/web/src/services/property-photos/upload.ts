import { api } from "@/lib/api";

export interface PropertyPhotoResponse {
  id: string;
  propertyId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  order: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface UploadPropertyPhotoInput {
  propertyId: string;
  file: File;
  isPrimary?: boolean;
}

export interface UploadPropertyPhotoResponse {
  success: boolean;
  message: string;
  data: PropertyPhotoResponse;
}

export const uploadPropertyPhoto = async (
  input: UploadPropertyPhotoInput,
): Promise<UploadPropertyPhotoResponse> => {
  const formData = new FormData();
  formData.append("file", input.file);

  if (input.isPrimary !== undefined) {
    formData.append("isPrimary", String(input.isPrimary));
  }

  const { data } = await api.post<UploadPropertyPhotoResponse>(
    `/api/properties/${input.propertyId}/photos`,
    formData,
    {
      headers: {
        "Content-Type": undefined,
      },
    },
  );

  return data;
};
