import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Order } from "../types";

export const useOrders = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["orders", userId],
    queryFn: async () => {
      const { data } = await api.get<{ orders: Order[] }>(`/order/${userId}`);
      return data.orders;
    },
    enabled: !!userId,
  });
};

export const usePlaceOrder = (userId: string | undefined) => {
  return useMutation({
    mutationFn: async (items: { productId: string; quantity: number }[]) => {
      const { data } = await api.post<{ paymentUrl: string }>(`/order/${userId}`, { items });
      return data;
    },
  });
};

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: async (reference: string) => {
      const { data } = await api.put(`/order/verify?reference=${reference}`);
      return data;
    },
  });
};
