export type SubscriptionStatus = "active" | "pending" | "canceled" | "expired";

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt?: string;
  updatedAt?: string;
  daysRemaining: number | null;
  plan?: {
    id: string;
    name: string;
    price: number;
    features?: string[];
  };
}
