import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import { getCheckoutInfo } from "@/services/subscription/get-checkout-info";

export function useCheckoutInfo(checkoutToken: string | null) {
  return useQuery({
    queryKey: queryKeys.subscription.checkoutInfo(checkoutToken || ""),
    queryFn: () => {
      if (!checkoutToken) {
        throw new Error("Checkout token is required");
      }
      return getCheckoutInfo(checkoutToken);
    },
    retry: false,
    enabled: !!checkoutToken,
  });
}
