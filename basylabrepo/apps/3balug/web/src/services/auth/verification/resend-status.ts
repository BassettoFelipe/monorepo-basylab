import { api } from "@/lib/api";
import type { ResendStatusResponse } from "@/types/auth.types";

export const getResendStatus = async (email: string): Promise<ResendStatusResponse> => {
  const { data } = await api.post<ResendStatusResponse>("/auth/resend-status", {
    email,
  });
  return data;
};
