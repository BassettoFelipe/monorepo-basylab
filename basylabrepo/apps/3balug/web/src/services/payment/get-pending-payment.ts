import { api } from "@/lib/api";

export const getPendingPayment = async (id: string) => {
  const { data } = await api.get(`/payments/pending/${id}`);
  return data;
};
