import { api } from "@/lib/api";
import type { ActivateSubscriptionData, ActivateSubscriptionResponse } from "@/types/auth.types";

export interface ActivateSubscriptionParams {
  checkoutToken: string;
  data: ActivateSubscriptionData;
}

export const activateSubscription = async ({
  checkoutToken,
  data,
}: ActivateSubscriptionParams): Promise<ActivateSubscriptionResponse> => {
  if (!checkoutToken) {
    throw new Error("Token de checkout não encontrado");
  }

  const { data: response } = await api.post<ActivateSubscriptionResponse>(
    "/subscriptions/activate",
    data,
    {
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    },
  );
  return response;
};

export const activateSubscriptionWithAuth = async (
  data: ActivateSubscriptionData,
): Promise<ActivateSubscriptionResponse> => {
  const { data: response } = await api.post<ActivateSubscriptionResponse>(
    "/subscriptions/activate",
    data,
  );
  return response;
};
