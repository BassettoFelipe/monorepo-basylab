import { api } from "@/lib/api";
import type {
  ResendVerificationCodeData,
  ResendVerificationCodeResponse,
} from "@/types/auth.types";

export const resendVerificationCode = async (
  data: ResendVerificationCodeData,
): Promise<ResendVerificationCodeResponse> => {
  const { data: response } = await api.post<ResendVerificationCodeResponse>(
    "/auth/resend-verification-code",
    data,
  );
  return response;
};
