import { api } from "@/lib/api";

export interface ResendPasswordResetCodeResponse {
  remainingResendAttempts: number;
  canResendAt: string;
  codeExpiresAt: string;
}

export const resendPasswordResetCode = async (
  email: string,
): Promise<ResendPasswordResetCodeResponse> => {
  const { data } = await api.post<ResendPasswordResetCodeResponse>(
    "/auth/resend-password-reset-code",
    { email },
  );

  return data;
};
